#!/usr/bin/env node
import{Command as Ce}from"@commander-js/extra-typings";import{platform as M,homedir as R}from"node:os";import{join as b}from"node:path";import{lstatSync as O,readdirSync as X,existsSync as S}from"node:fs";import{outputJson as z,readJson as Z,pathExists as V}from"fs-extra/esm";var g=class r{_appDataPath;_configFileName="config.json";get _configPath(){return b(this._appDataPath,this._configFileName)}constructor(e){let t=process.env.APPDATA;if(!t)switch(M()){case"win32":t=this._getWindowsAppDataPath();break;case"linux":t=this._getLinuxAppDataPath();break;case"darwin":t=this._getMacAppDataPath();break;default:t=this._getFallbackAppDataPath();break}this._appDataPath=b(t,e)}_getWindowsAppDataPath(){return b(R(),"AppData","Roaming")}_getLinuxAppDataPath(){return b(R(),".config")}_getMacAppDataPath(){return b(R(),"Library","Application Support")}_getFallbackAppDataPath(){return M()==="win32"?this._getWindowsAppDataPath():this._getLinuxAppDataPath()}static _getDirectories(e){return X(e,{withFileTypes:!0}).filter(t=>t.isDirectory()).map(t=>b(e,t.name))}static getProjectDirectories(e,t,n){let i=e.filter(u=>S(u)&&O(u).isDirectory()),a=t.filter(u=>S(u)&&O(u).isDirectory()),c=n.filter(u=>S(u)&&O(u).isDirectory());return[].concat(...i.map(r._getDirectories)).filter(u=>c.includes(u)?!1:!i.includes(u)).concat(...a)}safeValidateConfig(e){return!e.basePath||typeof e.basePath!="string"||!S(e.basePath)?{success:!1,error:"Invalid project base path in config! Must be a valid directory."}:!e.openWith||typeof e.openWith!="string"?{success:!1,error:"Invalid command in config! Must be a string."}:e.subDirectories&&!Array.isArray(e.subDirectories)?{success:!1,error:"Invalid subdirectories in config! Must be an array of directories."}:e.projectDirectories?.include&&!Array.isArray(e.projectDirectories.include)?{success:!1,error:"Invalid project include in config! Must be an array of directories."}:e.projectDirectories?.exclude&&!Array.isArray(e.projectDirectories.exclude)?{success:!1,error:"Invalid project exclude in config! Must be an array of directories."}:{success:!0,data:{basePath:e.basePath,subDirectories:e.subDirectories??[],openWith:e.openWith,projectDirectories:{include:e.projectDirectories?.include??[],exclude:e.projectDirectories?.exclude??[]}}}}async safeGetConfig(){try{if(!await V(this._configPath))return{success:!1,error:"No config file found. Please initialize project manager first."}}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}try{let e=await Z(this._configPath),t=this.safeValidateConfig(e);return t.success?{success:!0,data:t.data}:t}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}}async safeConfigExists(){try{return{success:!0,data:await V(this._configPath)}}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}}async safeCreateConfig(e){let t=this.safeValidateConfig(e);if(!t.success)return t;try{return await z(this._configPath,t.data,{spaces:2,encoding:"utf-8"}),{success:!0,data:void 0}}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}}async safeSetConfig(e,t){try{return await z(this._configPath,{basePath:e.basePath??t.basePath,subDirectories:e.subDirectories??t.subDirectories,openWith:e.openWith??t.openWith,projectDirectories:{include:e.projectDirectories?.include??t.projectDirectories.include,exclude:e.projectDirectories?.exclude??t.projectDirectories.exclude}},{spaces:2,encoding:"utf-8"}),{success:!0,data:void 0}}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}}};import{cancel as K,intro as H,isCancel as ee,outro as te,log as T}from"@clack/prompts";import{TextPrompt as re}from"@clack/core";import o from"picocolors";import ie from"is-unicode-supported";import{join as N}from"node:path";import{homedir as E}from"node:os";import{existsSync as G,lstatSync as U}from"node:fs";import{Fzf as oe,extendedMatch as ne}from"fzf";function p(r){return r?typeof r!="string"?[]:[...new Set(r.split(","))].map(t=>t.trim()).filter(Boolean):[]}function f(r,e=!1){return function(t){let n=p(t);if(!n.every(i=>G(N(e?E():r,i))))return"Some directories do not exist";if(!n.every(i=>U(N(e?E():r,i)).isDirectory()))return"Some paths are not directories"}}function $(r){if(!G(r))return"Path does not exist";if(!r.toLowerCase().startsWith(E().toLowerCase())||!r[E().length+1])return"Directory must be inside your home directory";if(!U(r).isDirectory())return"Path is not a directory"}var d=class r{static getErrorString(e,t=!1){let n=typeof e=="string"?e:e instanceof Error?e.message:"An unexpected error occurred. Please try again.";return`${t?`${o.bgRed(o.black(" ERROR "))} `:""}${o.red(n)}`}static getSuccessString(e,t=!1){return`${t?`${o.bgGreen(o.black(" SUCCESS "))} `:""}${o.green(e)}`}static getInfoString(e,t=!1){return`${t?`${o.bgCyan(o.black(" INFO "))} `:""}${o.cyan(e)}`}static error=e=>{T.error(r.getErrorString(e,!0))};static success=e=>{T.success(r.getSuccessString(e,!0))};static info=e=>{T.info(r.getInfoString(e,!0))}};function y(r){H(d.getInfoString(r??"Project Manager".toUpperCase()))}function F(r){return`${o.bgCyan(" OPTIONAL ")} ${r}`}function P(r){te(d.getSuccessString(r??"Thanks for using Project Manager!"))}function A(r,e="Process cancelled."){ee(r)&&(K(e),process.exit(0))}function l(r,e=!1){K(d.getErrorString(r,!0)),process.exit(e?1:0)}var se=ie(),h=(r,e)=>se?r:e,ae=h("\u25C6","*"),ce=h("\u25A0","x"),ue=h("\u25B2","x"),le=h("\u25C7","o"),pe=h("\u251C","+"),m=h("\u2502","|"),B=h("\u2514","\u2014"),de=r=>{switch(r){case"initial":case"active":return o.cyan(ae);case"cancel":return o.red(ce);case"error":return o.yellow(ue);case"submit":return o.green(le)}};function D(r){let e=[],[t,...n]=r.split(`
`);return e.push(`${t}`,...n.map(i=>`${o.cyan(m)}  ${i}`)),e.join(`
`)}var fe=(r,e,t)=>t(r.item).trim().length-t(e.item).trim().length;function ge(r,e){return r.split("").map((i,a)=>e.has(a)?o.green(i):i).join("")}function w({title:r,color:e,end:t}){return`${r}${e}  ${t}`}function q(r){let e=new oe(r.items,{match:ne,tiebreakers:[fe]});return new re({validate(t){if(!e.find(t).length)return"No results found."},placeholder:r.placeholder,defaultValue:r.defaultValue,initialValue:r.initialValue,render(){let t=e.find(this.value??""),n=`${o.gray(m)}
${de(this.state)}  ${r.message}
`,i=r.placeholder?o.inverse(r.placeholder[0])+o.dim(r.placeholder.slice(1)):o.inverse(o.hidden("_")),a=this.value?this.valueWithCursor:i;switch(this.state){case"error":return w({title:n.trim(),color:`
${o.yellow(m)}`,end:`${a}
${o.yellow(B)}  ${o.yellow(this.error)}
`});case"submit":return this.value=t[0].item,w({title:n,color:o.gray(m),end:o.dim(t[0].item||r.placeholder)});case"cancel":return w({title:n,color:o.gray(m),end:`${o.strikethrough(o.dim(this.value??""))}${this.value?.trim()?`
`+o.gray(m):""}`});default:return w({title:n,color:o.cyan(m),end:`${a}${t.length?`
`+t.map(c=>`${o.cyan(pe)}  ${o.dim(ge(c.item.normalize(),c.positions))}`).join(`
`):""}
${o.cyan(B)}
`})}}}).prompt()}import{homedir as me}from"node:os";import{join as he}from"node:path";import{cancel as I,group as be,text as C}from"@clack/prompts";import{homedir as Y}from"os";var s={basePath:()=>D(`Where do you store your projects? (must be inside '${Y()}')`),subDirectories:r=>D(`Which subdirectories do you store your projects in?
Separate them with a comma
(must be inside '${r}', only specify relative paths)`),openWith:()=>D(`Which program do you want to open your projects with?
(the current working directory will be the selected project directory)`),projectInclude:()=>D(`Which projects do you want to include?
Separate them with a comma
(must be inside '${Y()}', only specify relative paths)`),projectExclude:r=>D(`Which projects/directories do you want to exclude?
Separate them with a comma
(must be inside of a subdirectory you specified,
only specify relative path to '${r}')`),subDirectoriesExample:"For example: nodejs/cli-tools, nodejs/web-apps",projectIncludeExample:"For example: nodejs/portfolio",projectExcludeExample:"For example: nodejs/portfolio/backend",openWithExample:"For example: code ."},j={init:"Initialization cancelled.",config:"Configuration cancelled."},W={done:()=>"Overriden config. You can continue using Project Manager.",cancelled:()=>"Configuration cancelled."};async function J(r){y();let e=await r.safeConfigExists();if(!e.success)return l(e.error);if(e.data)return l("Initialization already done. You can start using Project Manager.");let t=await be({basePath:()=>C({message:s.basePath(),initialValue:he(me()),validate:$}),subDirectories:({results:{basePath:i}})=>i?C({message:s.subDirectories(i),placeholder:s.subDirectoriesExample,validate:f(i)}):I(j.init),openWith:()=>C({message:s.openWith(),placeholder:s.openWithExample,validate:i=>{if(!i)return"Command cannot be empty"}}),projectInclude:({results:{basePath:i}})=>i?C({message:F(s.projectInclude()),placeholder:s.projectIncludeExample,validate:f(i,!0)}):I(j.init),projectExclude:({results:{basePath:i}})=>i?C({message:F(s.projectExclude(i)),placeholder:s.projectExcludeExample,validate:f(i)}):I(j.init)},{onCancel:()=>{I(j.init),process.exit(0)}}),n=await r.safeCreateConfig({basePath:t.basePath,subDirectories:p(t.subDirectories),projectDirectories:{include:p(t.projectInclude),exclude:p(t.projectExclude)},openWith:t.openWith});if(!n.success)return l(n.error);P("Initialization done. You can start using Project Manager.")}import{join as _,relative as ye}from"node:path";import{execa as Pe}from"execa";import{homedir as k}from"node:os";async function L(r){y();let e=await r.safeGetConfig();if(!e.success)return l(e.error);let{data:t}=e,n=g.getProjectDirectories(t.subDirectories.map(a=>_(t.basePath,a)),t.projectDirectories.include.map(a=>_(k(),a)),t.projectDirectories.exclude.map(a=>_(t.basePath,a))).map(a=>ye(k(),a)),i=await q({items:n,message:`Enter a project directory (relative to '${k()}')`});A(i,"Project selection cancelled."),t.openWith&&await Pe(t.openWith,{cwd:_(k(),i),stdio:"inherit"}),P()}import{cancel as De,group as xe,multiselect as je,text as v}from"@clack/prompts";function x(r,e=!1){return e?r.length?r.join(", "):"":r.length?`'${r.join("', '")}'`:"none"}async function Q(r){y();let e=await r.safeGetConfig();if(!e.success)return l(e.error);let{data:t}=e,n=await je({message:"Select option(s) to edit",options:[{label:"Base path",value:"basePath",hint:`current: '${t.basePath}'`},{label:"Subdirectories",value:"subDirectories",hint:`current: ${x(t.subDirectories)}`},{label:"Command to open projects with",value:"openWith",hint:`current: '${t.openWith}'`},{label:"Included projects",value:"include",hint:`current: ${x(t.projectDirectories.include)}`},{label:"Excluded projects",value:"exclude",hint:`current: ${x(t.projectDirectories.exclude)}`}],required:!0});A(n,W.cancelled());let i=await xe({...n.includes("basePath")&&{basePath:()=>v({message:s.basePath(),initialValue:t.basePath,validate:$})},...n.includes("subDirectories")&&{subDirectories:({results:{basePath:c}})=>v({message:s.subDirectories(c??t.basePath),initialValue:t.subDirectories.length?x(t.subDirectories,!0):void 0,placeholder:t.subDirectories.length?void 0:s.subDirectoriesExample,validate:f(c??t.basePath)})},...n.includes("openWith")&&{openWith:()=>v({message:s.openWith(),initialValue:t.openWith??void 0,placeholder:t.openWith?void 0:s.openWithExample})},...n.includes("include")&&{includeProjects:({results:{basePath:c}})=>v({message:s.projectInclude(),initialValue:t.projectDirectories.include.length?x(t.projectDirectories.include,!0):void 0,placeholder:t.projectDirectories.include.length?void 0:s.projectIncludeExample,validate:f(c??t.basePath,!0)})},...n.includes("exclude")&&{excludeProjects:({results:{basePath:c}})=>v({message:s.projectExclude(c??t.basePath),initialValue:t.projectDirectories.exclude.length?x(t.projectDirectories.exclude,!0):void 0,placeholder:t.projectDirectories.exclude.length?void 0:s.projectExcludeExample,validate:f(c??t.basePath)})}},{onCancel:()=>{De(W.cancelled()),process.exit(0)}}),a=await r.safeSetConfig({basePath:i.basePath,subDirectories:n.includes("subDirectories")?p(i.subDirectories):void 0,projectDirectories:{include:n.includes("include")?p(i.includeProjects):void 0,exclude:n.includes("exclude")?p(i.excludeProjects):void 0},openWith:i.openWith},t);if(!a.success)return l(a.error);P(W.done())}async function ve(){let r=new g("project-manager"),e=new Ce().name("project-manager").description("Project Manager is a CLI tool for managing projects and easily navigate between them.").version(d.getInfoString(`v${process.env.npm_package_version}`,!0)).option("--","select a project");e.command("select").description("select a project").action(async()=>{await L(r)}),e.command("init").description("initialize project manager").action(async()=>{await J(r)}),e.command("config").description("configure project manager").action(async()=>{await Q(r)});try{process.argv.length===2?await L(r):await e.parseAsync(process.argv),process.exit(0)}catch(t){l(t),process.exit(1)}}ve().catch(r=>{d.error(r),process.exit(1)});
