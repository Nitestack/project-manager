#!/usr/bin/env node
import{Command as je}from"@commander-js/extra-typings";import{platform as F,homedir as _}from"node:os";import{join as b}from"node:path";import{lstatSync as k,readdirSync as J,existsSync as S}from"node:fs";import{outputJson as L,readJson as H,pathExists as M}from"fs-extra/esm";var g=class r{_appDataPath;_configFileName="config.json";get _configPath(){return b(this._appDataPath,this._configFileName)}constructor(t){let e=process.env.APPDATA;if(!e)switch(F()){case"win32":e=this._getWindowsAppDataPath();break;case"linux":e=this._getLinuxAppDataPath();break;case"darwin":e=this._getMacAppDataPath();break;default:e=this._getFallbackAppDataPath();break}this._appDataPath=b(e,t)}_getWindowsAppDataPath(){return b(_(),"AppData","Roaming")}_getLinuxAppDataPath(){return b(_(),".config")}_getMacAppDataPath(){return b(_(),"Library","Application Support")}_getFallbackAppDataPath(){return F()==="win32"?this._getWindowsAppDataPath():this._getLinuxAppDataPath()}static _getDirectories(t){return J(t,{withFileTypes:!0}).filter(e=>e.isDirectory()).map(e=>b(t,e.name))}static getProjectDirectories(t,e,o){let n=t.filter(l=>S(l)&&k(l).isDirectory()),a=e.filter(l=>S(l)&&k(l).isDirectory()),c=o.filter(l=>S(l)&&k(l).isDirectory());return[].concat(...n.map(r._getDirectories)).filter(l=>c.includes(l)?!1:!n.includes(l)).concat(...a)}safeValidateConfig(t){return!t.basePath||typeof t.basePath!="string"||!S(t.basePath)?{success:!1,error:"Invalid project base path in config! Must be a valid directory."}:!t.openWith||typeof t.openWith!="string"?{success:!1,error:"Invalid command in config! Must be a string."}:t.subDirectories&&!Array.isArray(t.subDirectories)?{success:!1,error:"Invalid subdirectories in config! Must be an array of directories."}:t.projectDirectories?.include&&!Array.isArray(t.projectDirectories.include)?{success:!1,error:"Invalid project include in config! Must be an array of directories."}:t.projectDirectories?.exclude&&!Array.isArray(t.projectDirectories.exclude)?{success:!1,error:"Invalid project exclude in config! Must be an array of directories."}:{success:!0,data:{basePath:t.basePath,subDirectories:t.subDirectories??[],openWith:t.openWith,projectDirectories:{include:t.projectDirectories?.include??[],exclude:t.projectDirectories?.exclude??[]}}}}async safeGetConfig(){try{if(!await M(this._configPath))return{success:!1,error:"No config file found. Please initialize project manager first."}}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}try{let t=await H(this._configPath),e=this.safeValidateConfig(t);return e.success?{success:!0,data:e.data}:e}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}}async safeConfigExists(){try{return{success:!0,data:await M(this._configPath)}}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}}async safeCreateConfig(t){let e=this.safeValidateConfig(t);if(!e.success)return e;try{return await L(this._configPath,e.data,{spaces:2,encoding:"utf-8"}),{success:!0,data:void 0}}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}}async safeSetConfig(t,e){try{return await L(this._configPath,{basePath:t.basePath??e.basePath,subDirectories:t.subDirectories??e.subDirectories,openWith:t.openWith??e.openWith,projectDirectories:{include:t.projectDirectories?.include??e.projectDirectories.include,exclude:t.projectDirectories?.exclude??e.projectDirectories.exclude}},{spaces:2,encoding:"utf-8"}),{success:!0,data:void 0}}catch{return{success:!1,error:"An unexpected error occurred. Please try again."}}}};import{cancel as B,intro as Q,isCancel as X,outro as Z,log as R}from"@clack/prompts";import{TextPrompt as ee}from"@clack/core";import i from"picocolors";import te from"is-unicode-supported";import{join as z}from"node:path";import{homedir as V}from"node:os";import{existsSync as K,lstatSync as G}from"node:fs";import{Fzf as re,extendedMatch as ie}from"fzf";function p(r){return r?typeof r!="string"?[]:[...new Set(r.split(","))].map(e=>e.trim()).filter(Boolean):[]}function f(r){return function(t){let e=p(t);if(!e.every(o=>K(z(r,o))))return"Some directories do not exist";if(!e.every(o=>G(z(r,o)).isDirectory()))return"Some paths are not directories"}}function E(r){if(!K(r))return"Path does not exist";if(!r.toLowerCase().startsWith(V().toLowerCase())||!r[V().length+1])return"Directory must be inside your home directory";if(!G(r).isDirectory())return"Path is not a directory"}var d=class r{static getErrorString(t,e=!1){let o=typeof t=="string"?t:t instanceof Error?t.message:"An unexpected error occurred. Please try again.";return`${e?`${i.bgRed(i.black(" ERROR "))} `:""}${i.red(o)}`}static getSuccessString(t,e=!1){return`${e?`${i.bgGreen(i.black(" SUCCESS "))} `:""}${i.green(t)}`}static getInfoString(t,e=!1){return`${e?`${i.bgCyan(i.black(" INFO "))} `:""}${i.cyan(t)}`}static error=t=>{R.error(r.getErrorString(t,!0))};static success=t=>{R.success(r.getSuccessString(t,!0))};static info=t=>{R.info(r.getInfoString(t,!0))}};function y(r){Q(d.getInfoString(r??"Project Manager".toUpperCase()))}function O(r){return`${i.bgCyan(" OPTIONAL ")} ${r}`}function P(r){Z(d.getSuccessString(r??"Thanks for using Project Manager!"))}function $(r,t="Process cancelled."){X(r)&&(B(t),process.exit(0))}function u(r,t=!1){B(d.getErrorString(r,!0)),process.exit(t?1:0)}var oe=te(),h=(r,t)=>oe?r:t,ne=h("\u25C6","*"),se=h("\u25A0","x"),ae=h("\u25B2","x"),ce=h("\u25C7","o"),le=h("\u251C","+"),m=h("\u2502","|"),N=h("\u2514","\u2014"),ue=r=>{switch(r){case"initial":case"active":return i.cyan(ne);case"cancel":return i.red(se);case"error":return i.yellow(ae);case"submit":return i.green(ce)}};function D(r){let t=[],[e,...o]=r.split(`
`);return t.push(`${e}`,...o.map(n=>`${i.cyan(m)}  ${n}`)),t.join(`
`)}var pe=(r,t,e)=>e(r.item).trim().length-e(t.item).trim().length;function de(r,t){return r.split("").map((n,a)=>t.has(a)?i.green(n):n).join("")}function w({title:r,color:t,end:e}){return`${r}${t}  ${e}`}function U(r){let t=new re(r.items,{match:ie,tiebreakers:[pe]});return new ee({validate(e){if(!t.find(e).length)return"No results found."},placeholder:r.placeholder,defaultValue:r.defaultValue,initialValue:r.initialValue,render(){let e=t.find(this.value??""),o=`${i.gray(m)}
${ue(this.state)}  ${r.message}
`,n=r.placeholder?i.inverse(r.placeholder[0])+i.dim(r.placeholder.slice(1)):i.inverse(i.hidden("_")),a=this.value?this.valueWithCursor:n;switch(this.state){case"error":return w({title:o.trim(),color:`
${i.yellow(m)}`,end:`${a}
${i.yellow(N)}  ${i.yellow(this.error)}
`});case"submit":return this.value=e[0].item,w({title:o,color:i.gray(m),end:i.dim(e[0].item||r.placeholder)});case"cancel":return w({title:o,color:i.gray(m),end:`${i.strikethrough(i.dim(this.value??""))}${this.value?.trim()?`
`+i.gray(m):""}`});default:return w({title:o,color:i.cyan(m),end:`${a}${e.length?`
`+e.map(c=>`${i.cyan(le)}  ${i.dim(de(c.item.normalize(),c.positions))}`).join(`
`):""}
${i.cyan(N)}
`})}}}).prompt()}import{homedir as ge}from"node:os";import{join as me}from"node:path";import{cancel as W,group as he,text as C}from"@clack/prompts";import{homedir as fe}from"os";var s={basePath:()=>D(`Where do you store your projects? (must be inside '${fe()}')`),subDirectories:r=>D(`Which subdirectories do you store your projects in?
Separate them with a comma
(must be inside '${r}', only specify relative paths)`),openWith:()=>D(`Which program do you want to open your projects with?
(the current working directory will be the selected project directory)`),projectInclude:r=>D(`Which projects do you want to include?
Separate them with a comma
(must be inside '${r}', only specify relative paths)`),projectExclude:r=>D(`Which projects/directories do you want to exclude?
Separate them with a comma
(must be inside of a subdirectory you specified,
only specify relative path to '${r}')`),subDirectoriesExample:"For example: nodejs/cli-tools, nodejs/web-apps",projectIncludeExample:"For example: nodejs/portfolio",projectExcludeExample:"For example: nodejs/portfolio/backend",openWithExample:"For example: code ."},j={init:"Initialization cancelled.",config:"Configuration cancelled."},A={done:()=>"Overriden config. You can continue using Project Manager.",cancelled:()=>"Configuration cancelled."};async function q(r){y();let t=await r.safeConfigExists();if(!t.success)return u(t.error);if(t.data)return u("Initialization already done. You can start using Project Manager.");let e=await he({basePath:()=>C({message:s.basePath(),initialValue:me(ge()),validate:E}),subDirectories:({results:{basePath:n}})=>n?C({message:s.subDirectories(n),placeholder:s.subDirectoriesExample,validate:f(n)}):W(j.init),openWith:()=>C({message:s.openWith(),placeholder:s.openWithExample,validate:n=>{if(!n)return"Command cannot be empty"}}),projectInclude:({results:{basePath:n}})=>n?C({message:O(s.projectInclude(n)),placeholder:s.projectIncludeExample,validate:f(n)}):W(j.init),projectExclude:({results:{basePath:n}})=>n?C({message:O(s.projectExclude(n)),placeholder:s.projectExcludeExample,validate:f(n)}):W(j.init)},{onCancel:()=>{W(j.init),process.exit(0)}}),o=await r.safeCreateConfig({basePath:e.basePath,subDirectories:p(e.subDirectories),projectDirectories:{include:p(e.projectInclude),exclude:p(e.projectExclude)},openWith:e.openWith});if(!o.success)return u(o.error);P("Initialization done. You can start using Project Manager.")}import{join as I,sep as be}from"node:path";import{execa as ye}from"execa";async function T(r){y();let t=await r.safeGetConfig();if(!t.success)return u(t.error);let{data:e}=t,o=g.getProjectDirectories(e.subDirectories.map(a=>I(e.basePath,a)),e.projectDirectories.include.map(a=>I(e.basePath,a)),e.projectDirectories.exclude.map(a=>I(e.basePath,a))).map(a=>a.replace(e.basePath+be,"")),n=await U({items:o,message:`Enter a project directory (relative to '${e.basePath}')`});$(n,"Project selection cancelled."),e.openWith&&await ye(e.openWith,{cwd:I(e.basePath,n),stdio:"inherit"}),P()}import{cancel as Pe,group as De,multiselect as xe,text as v}from"@clack/prompts";function x(r,t=!1){return t?r.length?r.join(", "):"":r.length?`'${r.join("', '")}'`:"none"}async function Y(r){y();let t=await r.safeGetConfig();if(!t.success)return u(t.error);let{data:e}=t,o=await xe({message:"Select option(s) to edit",options:[{label:"Base path",value:"basePath",hint:`current: '${e.basePath}'`},{label:"Subdirectories",value:"subDirectories",hint:`current: ${x(e.subDirectories)}`},{label:"Command to open projects with",value:"openWith",hint:`current: '${e.openWith}'`},{label:"Included projects",value:"include",hint:`current: ${x(e.projectDirectories.include)}`},{label:"Excluded projects",value:"exclude",hint:`current: ${x(e.projectDirectories.exclude)}`}],required:!0});$(o,A.cancelled());let n=await De({...o.includes("basePath")&&{basePath:()=>v({message:s.basePath(),initialValue:e.basePath,validate:E})},...o.includes("subDirectories")&&{subDirectories:({results:{basePath:c}})=>v({message:s.subDirectories(c??e.basePath),initialValue:e.subDirectories.length?x(e.subDirectories,!0):void 0,placeholder:e.subDirectories.length?void 0:s.subDirectoriesExample,validate:f(c??e.basePath)})},...o.includes("openWith")&&{openWith:()=>v({message:s.openWith(),initialValue:e.openWith??void 0,placeholder:e.openWith?void 0:s.openWithExample})},...o.includes("include")&&{includeProjects:({results:{basePath:c}})=>v({message:s.projectInclude(c??e.basePath),initialValue:e.projectDirectories.include.length?x(e.projectDirectories.include,!0):void 0,placeholder:e.projectDirectories.include.length?void 0:s.projectIncludeExample,validate:f(c??e.basePath)})},...o.includes("exclude")&&{excludeProjects:({results:{basePath:c}})=>v({message:s.projectExclude(c??e.basePath),initialValue:e.projectDirectories.exclude.length?x(e.projectDirectories.exclude,!0):void 0,placeholder:e.projectDirectories.exclude.length?void 0:s.projectExcludeExample,validate:f(c??e.basePath)})}},{onCancel:()=>{Pe(A.cancelled()),process.exit(0)}}),a=await r.safeSetConfig({basePath:n.basePath,subDirectories:o.includes("subDirectories")?p(n.subDirectories):void 0,projectDirectories:{include:o.includes("include")?p(n.includeProjects):void 0,exclude:o.includes("exclude")?p(n.excludeProjects):void 0},openWith:n.openWith},e);if(!a.success)return u(a.error);P(A.done())}async function Ce(){let r=new g("project-manager"),t=new je().name("project-manager").description("Project Manager is a CLI tool for managing projects and easily navigate between them.").version(d.getInfoString(`v${process.env.npm_package_version}`,!0)).option("--","select a project");t.command("select").description("select a project").action(async()=>{await T(r)}),t.command("init").description("initialize project manager").action(async()=>{await q(r)}),t.command("config").description("configure project manager").action(async()=>{await Y(r)});try{process.argv.length===2?await T(r):await t.parseAsync(process.argv),process.exit(0)}catch(e){u(e),process.exit(1)}}Ce().catch(r=>{d.error(r),process.exit(1)});