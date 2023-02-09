import { ponder } from "../generated";
import { utils, BigNumber } from "ethers";
import { Context } from "../generated/app";

ponder.on("GenArt721CoreV3:ProjectUpdated", async ({ event, context }) => {
  // Only run when the ProjectUpdated event is called with _update = "script".
  if (event.params._update !== utils.formatBytes32String("script")) {
    return;
  }

  // // Refresh V1 project data once per run.
  const V1_REFRESH_BLOCK_NUMBER = 16582214;
  if (event.block.number === V1_REFRESH_BLOCK_NUMBER) {
    console.log("Fetching V1 project data...");
    await refreshV1ProjectData(context, V1_REFRESH_BLOCK_NUMBER);
  }

  const projectDetails = await context.contracts.GenArt721CoreV3.projectDetails(
    event.params._projectId,
    { blockTag: event.block.number }
  );
  const scriptDetails =
    await context.contracts.GenArt721CoreV3.projectScriptDetails(
      event.params._projectId,
      { blockTag: event.block.number }
    );
  const scriptCount = scriptDetails.scriptCount.toNumber();

  let script = "";
  for (const scriptIndex of [...Array(scriptCount).keys()]) {
    const scriptFragment =
      await context.contracts.GenArt721CoreV3.projectScriptByIndex(
        event.params._projectId,
        BigNumber.from(scriptIndex),
        { blockTag: event.block.number }
      );
    script += scriptFragment;
  }

  await context.entities.ArtBlocksProject.upsert(
    event.params._projectId.toString(),
    {
      projectId: event.params._projectId.toNumber(),
      name: projectDetails.projectName,
      artistName: projectDetails.artist,
      description: projectDetails.description,
      website: projectDetails.website,
      license: projectDetails.license,
      scriptType: scriptDetails.scriptTypeAndVersion,
      script: script,
      aspectRatio: scriptDetails.aspectRatio,
    }
  );
});

// Projects 3 - 373 used V1 of the Art Blocks core contract, which
// sadly did not emit events for updates to project metadata.
// As a workaround, this function calls that contract to get
// metadata for all projects at a specific block number.
const refreshV1ProjectData = async (context: Context, blockNumber: number) => {
  for (const projectId of [...Array(373).keys()]) {
    try {
      const projectDetails =
        await context.contracts.GenArt721CoreV1.projectDetails(
          BigNumber.from(projectId),
          { blockTag: blockNumber }
        );

      if (projectDetails.projectName === "") continue;

      const scriptDetails =
        await context.contracts.GenArt721CoreV1.projectScriptInfo(
          BigNumber.from(projectId),
          { blockTag: blockNumber }
        );

      const aspectRatio =
        scriptDetails.scriptJSON !== ""
          ? JSON.parse(scriptDetails.scriptJSON).aspectRatio
          : "";
      const scriptType =
        scriptDetails.scriptJSON !== ""
          ? JSON.parse(scriptDetails.scriptJSON).type
          : "";

      const scriptCount = scriptDetails.scriptCount.toNumber();

      let script = "";
      for (const scriptIndex of [...Array(scriptCount).keys()]) {
        const scriptFragment =
          await context.contracts.GenArt721CoreV1.projectScriptByIndex(
            BigNumber.from(projectId),
            BigNumber.from(scriptIndex),
            { blockTag: blockNumber }
          );
        script += scriptFragment;
      }

      await context.entities.ArtBlocksProject.upsert(projectId.toString(), {
        projectId: projectId,
        name: projectDetails.projectName,
        artistName: projectDetails.artist,
        description: projectDetails.description,
        website: projectDetails.website,
        license: projectDetails.license,
        scriptType: scriptType,
        script: script,
        aspectRatio: aspectRatio,
      });
    } catch (err) {
      console.log(`Unable to get project: ${projectId}`);
      console.log(err);
    }
  }
};
