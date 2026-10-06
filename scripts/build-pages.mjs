import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root=process.cwd();
const stage=path.resolve(root,".pages-source");
const output=path.resolve(root,"out");
const nextBin=path.join(root,"node_modules","next","dist","bin","next");

function assertManaged(target,name){
  if(path.dirname(target)!==path.resolve(root)||path.basename(target)!==name)throw new Error(`Refusing to manage unexpected path: ${target}`);
}
assertManaged(stage,".pages-source");
assertManaged(output,"out");

await rm(stage,{recursive:true,force:true});
await mkdir(stage,{recursive:true});

for(const directory of ["app","components","lib","pages","public"]){
  await cp(path.join(root,directory),path.join(stage,directory),{recursive:true});
}
await rm(path.join(stage,"app","api"),{recursive:true,force:true});
await rm(path.join(stage,"public","brand"),{recursive:true,force:true});
await rm(path.join(stage,"public","fonts","Caveat.ttf"),{force:true});
await rm(path.join(stage,"public","fonts","Caveat-OFL.txt"),{force:true});
await rm(path.join(stage,"public","relationship-editor-preview.html"),{force:true});
for(const file of ["app/page.tsx","app/view/[mapId]/page.tsx","app/ecosystem/[mapId]/page.tsx","app/editor/page.tsx"]){
  const target=path.join(stage,file);
  const source=await readFile(target,"utf8");
  const staticParams=file.includes("[mapId]")?'\nexport function generateStaticParams(){return [{mapId:getPublishedMapId()}];}\n':'';
  await writeFile(target,source.replace('export const dynamic = "force-dynamic";',staticParams),"utf8");
}
await mkdir(path.join(stage,"data"),{recursive:true});
await cp(path.join(root,"data","published-catalog.json"),path.join(stage,"data","published-catalog.json"));
for(const file of ["next.config.mjs","next-env.d.ts","package.json","tsconfig.json"]){
  await cp(path.join(root,file),path.join(stage,file));
}

const result=spawnSync(process.execPath,[nextBin,"build"],{
  cwd:stage,
  stdio:"inherit",
  env:{...process.env,GITHUB_PAGES:"true",NEXT_DIST_DIR:".next"}
});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);

await rm(output,{recursive:true,force:true});
await cp(path.join(stage,"out"),output,{recursive:true});
await rm(stage,{recursive:true,force:true});
console.log(`GitHub Pages artifact ready: ${output}`);
