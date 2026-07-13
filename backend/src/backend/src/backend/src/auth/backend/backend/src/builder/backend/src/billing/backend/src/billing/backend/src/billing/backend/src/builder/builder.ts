import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync } from "fs";

const anthropic = new Anthropic();
const MODEL = "claude-sonnet-4-6";

export type BuildStage = "spec"|"architecture"|"scaffold"|"screens"|"logic"|"polish"|"qa";
export const STAGE_ORDER: BuildStage[] = ["spec","architecture","scaffold","screens","logic","polish","qa"];

export interface BuildState {
  buildId: string;
  userId: string;
  prompt: string;
  platform: "react-native"|"flutter";
  completedStages: BuildStage[];
  spec?: any;
  architecture?: any;
  outputDir: string;
}

async function callClaude(system: string, user: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: MODEL, max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = res.content.find(b => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

async function runSpecStage(state: BuildState) {
  const raw = await callClaude(
    `Convert a user's app idea into a strict JSON spec. Output ONLY valid JSON, no markdown:
{"appName":string,"category":string,"coreFeatures":string[],"targetUser":string,"monetization":"free"|"paid"|"subscription"|"ads"}`,
    state.prompt
  );
  return JSON.parse(raw.replace(/```json|```/g,"").trim());
}

async function runArchitectureStage(state: BuildState) {
  const raw = await callClaude(
    `Design mobile app architecture from a spec. Output ONLY valid JSON, no markdown:
{"screens":[{"name":string,"purpose":string,"components":string[]}],"navigation":"stack"|"tabs"|"drawer","dataModel":[{"entity":string,"fields":string[]}],"apiNeeds":string[]}`,
    JSON.stringify(state.spec)
  );
  return JSON.parse(raw.replace(/```json|```/g,"").trim());
}

function runScaffoldStage(state: BuildState) {
  mkdirSync(`${state.outputDir}/src/screens`,{recursive:true});
  mkdirSync(`${state.outputDir}/src/integrations`,{recursive:true});
  writeFileSync(`${state.outputDir}/app.config.json`,
    JSON.stringify({name:state.spec?.appName,bundleId:`com.platform.app${state.buildId.slice(0,8)}`},null,2)
  );
}

async function runScreensStage(state: BuildState) {
  for(const screen of state.architecture.screens){
    const code = await callClaude(
      `Generate a React Native screen component. Output ONLY code, no markdown.
Use theme tokens from src/theme.ts. Make it visually distinctive and production-quality.`,
      `Screen: ${screen.name}\nPurpose: ${screen.purpose}\nComponents: ${screen.components.join(", ")}\nApp: ${state.spec?.appName}`
    );
    writeFileSync(`${state.outputDir}/src/screens/${screen.name}.tsx`,code);
  }
}

async function runLogicStage(state: BuildState) {
  for(const need of state.architecture.apiNeeds){
    const code = await callClaude(
      `Generate the integration module for "${need}" in a React Native app. Output ONLY code, no markdown.`,
      JSON.stringify(state.spec)
    );
    writeFileSync(`${state.outputDir}/src/integrations/${need}.ts`,code);
  }
}

async function runPolishStage(state: BuildState) {
  const theme = await callClaude(
    `Generate a theme.ts file for a ${state.spec?.category} app called "${state.spec?.appName}".
Output ONLY a theme.ts file with colors, typography, and spacing tokens. Make it distinctive.`,
    JSON.stringify(state.spec)
  );
  writeFileSync(`${state.outputDir}/src/theme.ts`,theme);
}

export async function runNextStage(state: BuildState): Promise<BuildState> {
  const next = STAGE_ORDER.find(s => !state.completedStages.includes(s));
  if(!next) return state;
  switch(next){
    case "spec": state.spec=await runSpecStage(state); break;
    case "architecture": state.architecture=await runArchitectureStage(state); break;
    case "scaffold": runScaffoldStage(state); break;
    case "screens": await runScreensStage(state); break;
    case "logic": await runLogicStage(state); break;
    case "polish": await runPolishStage(state); break;
    case "qa": break;
  }
  state.completedStages.push(next);
  return state;
}
