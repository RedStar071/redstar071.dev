import type { SyncContent, SyncOptions, SyncProvider } from "./index";
import { useLogger } from "nuxt/kit";
import { useBuildAirspace, useBuildAirspaceWithSession } from "../../shared/airspace";

const logger = useLogger("sync:projects");

/**
 * Seeds `dev.redstar071.project` records from `content/projects/*.yml`, keyed
 * by file name, while the PDS has none. After that the records are the source
 * of truth: they are edited in the PDS (e.g. with pdsls.dev), and a deploy
 * never overwrites or deletes them. `content.config.ts` falls back to the
 * same YAML files while there are no records, so the site looks the same
 * either side of the seed.
 */
export class ProjectsProvider implements SyncProvider {
  name = "projects";

  async sync({ readProjects }: SyncContent, { dryRun }: SyncOptions): Promise<void> {
    const existing = await useBuildAirspace().projects.page({ limit: 1 });
    if (existing.records.length) {
      logger.info("Records already in the PDS, skipping the seed from content/projects");
      return;
    }

    // Validated before anything is written, so one bad file stops the seed
    // instead of leaving half the projects in the PDS.
    const projects = await readProjects();
    for (const [rkey, project] of projects) {
      const result = await useBuildAirspace().projects.validate(project);
      if (!result.ok) {
        const issues = result.issues.map(issue => `${issue.path}: ${issue.message}`).join("; ");
        throw new Error(`content/projects/${rkey}.yml does not match dev.redstar071.project (${issues})`);
      }
    }

    if (dryRun) {
      logger.info(`Would seed ${projects.size} project(s) from content/projects`);
      for (const [rkey, project] of projects) {
        logger.info(`  ${rkey}: ${project.title}`);
      }
      return;
    }

    const airspace = await useBuildAirspaceWithSession();
    // One commit, so either every project lands or none does.
    await airspace.batch((b) => {
      for (const [rkey, project] of projects) {
        b.projects.create(project, { rkey });
      }
    });
    logger.info(`Done: seeded ${projects.size} project(s)`);
  }
}
