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
      contributionsCollection: { totalCommitContributions: number; restrictedContributionsCount: number };
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
      contributionsCollection { totalCommitContributions restrictedContributionsCount }
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

/**
 * Profile numbers from the GitHub GraphQL API, which needs a token: a fine-grained one with
 * no extra permissions reads public data. Cached for an hour, so a busy README costs one call.
 */
export const fetchGitHubStats = defineCachedFunction(async (event: H3Event): Promise<GitHubStats | null> => {
  const config = useRuntimeConfig(event);
  if (!config.githubToken || !config.public.githubUsername)
    return null;

  const response = await $fetch<GraphQLResponse>("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${config.githubToken}`,
      "user-agent": "redstar071.dev"
    },
    body: { query: STATS_QUERY, variables: { login: config.public.githubUsername } },
    timeout: 8_000
  }).catch(() => null);
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
    languages: [...languages.values()].sort((a, b) => b.size - a.size)
  };
}, {
  name: "github-stats",
  maxAge: 60 * 60,
  swr: true,
  getKey: () => "stats",
  validate: entry => !!entry.value
});
