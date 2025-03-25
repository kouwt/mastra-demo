import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { cursorRulesWorkflow,candidateWorkflow,separateWorkflow} from "./workflows";
import { cursorRulesAgent, recruiterAgent} from "./agents";


export const mastra = new Mastra({
    agents: {
        cursorRulesAgent,recruiterAgent
    },
    workflows: {
        cursorRulesWorkflow,candidateWorkflow,separateWorkflow
    },
    logger: createLogger({
        name: "GitHub Cursor Rules Agent",
        level: "debug",
    }),
});

// const mastra1 = new Mastra({
//     workflows: {
//         cursorRulesWorkflow,
//     },
//   });

// (async () => {
//     const { runId, start } = mastra1
//         .getWorkflow("cursorRulesWorkflow")
//         .createRun();

//     console.log("Run", runId);

//     const runResult = await start({
//         triggerData: {
//             repositoryUrl: "https://github.com/honojs/hono",
//             branch: "main",
//             outputPath: "./examples/rules",
//         },
//     });

//     console.log("Final output:", runResult.results);
// })();
