import type { H3Event } from "h3";

export interface GitHubLanguage {
  name: string;
  color: string;
  /** Bytes of code across the counted repositories. */
  size: number;
}

export interface GitHubStats {
  login: string;
  name: string;
  stars: number;
  /** Commits over the last year, the window GitHub's contribution graph shows. */
  commits: number;
  pullRequests: number;
  issues: number;
  contributedTo: number;
  followers: number;
  repositories: number;
  /** Every year with contributions, newest first. */
  contributionYears: number[];
  languages: GitHubLanguage[];
}

interface GraphQLResponse {
  data?: {
    user: {
      login: string;
      name: string | null;
      followers: { totalCount: number };
      pullRequests: { totalCount: number };
      issues: { totalCount: number };
      repositoriesContributedTo: { totalCount: number };
      contributionsCollection: { totalCommitContributions: number; restrictedContributionsCount: number; contributionYears: number[] };
      repositories: {
        totalCount: number;
        nodes: Array<{
          stargazerCount: number;
          languages: { edges: Array<{ size: number; node: { name: string; color: string | null } }> };
        }>;
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
}

// Public, non-fork repositories only, including the organizations' ones: most of the work lives in wolfstar-project.
const STATS_QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      login
      name
      followers { totalCount }
      pullRequests { totalCount }
      issues { totalCount }
      repositoriesContributedTo(contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) { totalCount }
      contributionsCollection { totalCommitContributions restrictedContributionsCount contributionYears }
      repositories(
        first: 100
        privacy: PUBLIC
        isFork: false
        ownerAffiliations: [OWNER, ORGANIZATION_MEMBER]
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        totalCount
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
    }
  }
`;

/** One GraphQL call as the configured user; null when it fails. */
async function queryGitHub<T>(event: H3Event, query: string): Promise<T | null> {
  const config = useRuntimeConfig(event);
  return await $fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${config.githubToken}`,
      "user-agent": "redstar071.dev"
    },
    body: { query, variables: { login: config.public.githubUsername } },
    timeout: 8_000
  }).then(data => data as T, () => null);
}

/**
 * Profile numbers from the GitHub GraphQL API, which needs a token: a fine-grained one with
 * no extra permissions reads public data. Cached for an hour, so a busy README costs one call.
 */
export const fetchGitHubStats = defineCachedFunction(async (event: H3Event): Promise<GitHubStats | null> => {
  const config = useRuntimeConfig(event);
  if (!config.githubToken || !config.public.githubUsername)
    return null;

  const response = await queryGitHub<GraphQLResponse>(event, STATS_QUERY);
  const user = response?.data?.user;
  if (!user)
    return null;

  const languages = new Map<string, GitHubLanguage>();
  for (const repository of user.repositories.nodes) {
    for (const { size, node } of repository.languages.edges) {
      const language = languages.get(node.name) ?? { name: node.name, color: node.color ?? "#8b949e", size: 0 };
      language.size += size;
      languages.set(node.name, language);
    }
  }

  return {
    login: user.login,
    name: user.name ?? user.login,
    stars: user.repositories.nodes.reduce((total, repository) => total + repository.stargazerCount, 0),
    commits: user.contributionsCollection.totalCommitContributions + user.contributionsCollection.restrictedContributionsCount,
    pullRequests: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    contributedTo: user.repositoriesContributedTo.totalCount,
    followers: user.followers.totalCount,
    repositories: user.repositories.totalCount,
    contributionYears: user.contributionsCollection.contributionYears,
    languages: [...languages.values()].sort((a, b) => b.size - a.size)
  };
}, {
  name: "github-stats",
  maxAge: 60 * 60,
  swr: true,
  getKey: () => "stats",
  validate: entry => !!entry.value
});

/** A run of days in a row with at least one contribution, as `YYYY-MM-DD` dates. */
export interface Streak {
  length: number;
  start: string;
  end: string;
}

export interface GitHubStreak {
  /** Every contribution since the account's first, private ones included when the profile shows them. */
  total: number;
  /** The first day with a contribution. */
  firstDay: string | null;
  /** The run that ends today or yesterday: a day without contributions yet does not break it. */
  current: Streak;
  longest: Streak;
}

interface CalendarResponse {
  data?: {
    user: Record<string, {
      contributionCalendar: {
        totalContributions: number;
        weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }>;
      };
    }> | null;
  };
}

/** One calendar per year, in one query: `contributionsCollection` spans a year at most. */
function calendarQuery(years: number[]) {
  const collections = years.map(year => `
      y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }`).join("");
  return `query ($login: String!) { user(login: $login) {${collections}\n} }`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Streaks over a day-by-day contribution list, the way github-readme-streak-stats counts them. */
export function computeStreaks(days: Array<{ date: string; count: number }>, today: string): Omit<GitHubStreak, "total"> {
  const past = days.filter(day => day.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  const empty: Streak = { length: 0, start: today, end: today };

  // A year without contributions is not in `contributionYears`, so its days are missing rather
  // than zero: a run only goes on while each day follows the one before it.
  const follows = (date: string, previous: string | undefined) =>
    previous !== undefined && Date.parse(`${date}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`) === DAY_MS;

  let longest = empty;
  let runStart = "";
  let runLength = 0;
  past.forEach((day, index) => {
    if (day.count === 0) {
      runLength = 0;
      return;
    }
    if (runLength === 0 || !follows(day.date, past[index - 1]?.date)) {
      runStart = day.date;
      runLength = 0;
    }
    runLength++;
    if (runLength > longest.length)
      longest = { length: runLength, start: runStart, end: day.date };
  });

  // Today without contributions yet still counts the run up to yesterday.
  let index = past.length - 1;
  if (past[index]?.date === today && past[index]!.count === 0)
    index--;
  let current = empty;
  // The run has to reach today or yesterday to be current.
  if (index >= 0 && (past[index]!.date === today || follows(today, past[index]!.date))) {
    for (; index >= 0 && past[index]!.count > 0; index--) {
      const date = past[index]!.date;
      if (current.length && !follows(current.start, date))
        break;
      current = current.length ? { length: current.length + 1, start: date, end: current.end } : { length: 1, start: date, end: date };
    }
  }

  return {
    firstDay: past.find(day => day.count > 0)?.date ?? null,
    current,
    longest
  };
}

/** Contribution totals and streaks, from one calendar per year. Cached for an hour like the stats. */
export const fetchGitHubStreak = defineCachedFunction(async (event: H3Event): Promise<GitHubStreak | null> => {
  const stats = await fetchGitHubStats(event);
  if (!stats?.contributionYears.length)
    return null;

  const response = await queryGitHub<CalendarResponse>(event, calendarQuery(stats.contributionYears));
  const user = response?.data?.user;
  if (!user)
    return null;

  const calendars = Object.values(user).map(collection => collection.contributionCalendar);
  const days = calendars.flatMap(calendar => calendar.weeks.flatMap(week => week.contributionDays))
    .map(day => ({ date: day.date, count: day.contributionCount }));
  return {
    total: calendars.reduce((sum, calendar) => sum + calendar.totalContributions, 0),
    ...computeStreaks(days, new Date().toISOString().slice(0, 10))
  };
}, {
  name: "github-streak",
  maxAge: 60 * 60,
  swr: true,
  getKey: () => "streak",
  validate: entry => !!entry.value
});
