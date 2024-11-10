var e=Object.defineProperty,t=Object.defineProperties,r=Object.getOwnPropertyDescriptors,n=Object.getOwnPropertySymbols,o=Object.prototype.hasOwnProperty,a=Object.prototype.propertyIsEnumerable,i=(t,r,n)=>r in t?e(t,r,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[r]=n,s=(e,t)=>{for(var r in t||(t={}))o.call(t,r)&&i(e,r,t[r]);if(n)for(var r of n(t))a.call(t,r)&&i(e,r,t[r]);return e},l=(e,t)=>{var r={};for(var i in e)o.call(e,i)&&t.indexOf(i)<0&&(r[i]=e[i]);if(null!=e&&n)for(var i of n(e))t.indexOf(i)<0&&a.call(e,i)&&(r[i]=e[i]);return r};import{u,o as f,n as c,r as p,a as d,w as v,g as y,b as g,c as w,s as b}from"./vue-vendor-DWkQNG0n.js";function m(e){return"function"==typeof e?e():u(e)}const S="undefined"!=typeof window&&"undefined"!=typeof document;"undefined"!=typeof WorkerGlobalScope&&(globalThis,WorkerGlobalScope);const h=Object.prototype.toString,O=()=>{};const A=e=>e();function j(e,t,r={}){const n=r,{eventFilter:o=A}=n,a=l(n,["eventFilter"]);return v(e,(i=o,s=t,function(...e){return new Promise(((t,r)=>{Promise.resolve(i((()=>s.apply(this,e)),{fn:s,thisArg:this,args:e})).then(t).catch(r)}))}),a);var i,s}function F(e,n,o={}){const a=o,{eventFilter:i}=a,u=l(a,["eventFilter"]),{eventFilter:f,pause:c,resume:v,isActive:y}=function(e=A){const t=p(!0);return{isActive:d(t),pause:function(){t.value=!1},resume:function(){t.value=!0},eventFilter:(...r)=>{t.value&&e(...r)}}}(i);var g;return{stop:j(e,n,(g=s({},u),t(g,r({eventFilter:f})))),pause:c,resume:v,isActive:y}}function N(e,t=!0,r){w()?f(e,r):t?e():c(e)}const E=S?window:void 0;function I(e){var t;const r=m(e);return null!=(t=null==r?void 0:r.$el)?t:r}function P(...e){let t,r,n,o;if("string"==typeof e[0]||Array.isArray(e[0])?([r,n,o]=e,t=E):[t,r,n,o]=e,!t)return O;Array.isArray(r)||(r=[r]),Array.isArray(n)||(n=[n]);const a=[],i=()=>{a.forEach((e=>e())),a.length=0},l=v((()=>[I(t),m(o)]),(([e,t])=>{if(i(),!e)return;const o=(l=t,"[object Object]"===h.call(l)?s({},t):t);var l;a.push(...r.flatMap((t=>n.map((r=>((e,t,r,n)=>(e.addEventListener(t,r,n),()=>e.removeEventListener(t,r,n)))(e,t,r,o))))))}),{immediate:!0,flush:"post"}),u=()=>{l(),i()};var f;return f=u,y()&&g(f),u}const D="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},J="__vueuse_ssr_handlers__",_=k();function k(){return J in D||(D[J]=D[J]||{}),D[J]}const M={boolean:{read:e=>"true"===e,write:e=>String(e)},object:{read:e=>JSON.parse(e),write:e=>JSON.stringify(e)},number:{read:e=>Number.parseFloat(e),write:e=>String(e)},any:{read:e=>e,write:e=>String(e)},string:{read:e=>e,write:e=>String(e)},map:{read:e=>new Map(JSON.parse(e)),write:e=>JSON.stringify(Array.from(e.entries()))},set:{read:e=>new Set(JSON.parse(e)),write:e=>JSON.stringify(Array.from(e))},date:{read:e=>new Date(e),write:e=>e.toISOString()}},T="vueuse-storage";function V(e,t,r,n={}){var o;const{flush:a="pre",deep:i=!0,listenToStorageChanges:l=!0,writeDefaults:u=!0,mergeDefaults:f=!1,shallow:d,window:v=E,eventFilter:y,onError:g=e=>{},initOnMounted:w}=n,S=(d?b:p)(t);if(!r)try{r=function(e,t){return _[e]||t}("getDefaultStorage",(()=>{var e;return null==(e=E)?void 0:e.localStorage}))()}catch(V){g(V)}if(!r)return S;const h=m(t),O=function(e){return null==e?"any":e instanceof Set?"set":e instanceof Map?"map":e instanceof Date?"date":"boolean"==typeof e?"boolean":"string"==typeof e?"string":"object"==typeof e?"object":Number.isNaN(e)?"any":"number"}(h),A=null!=(o=n.serializer)?o:M[O],{pause:j,resume:I}=F(S,(()=>function(t){try{const n=r.getItem(e);if(null==t)D(n,null),r.removeItem(e);else{const o=A.write(t);n!==o&&(r.setItem(e,o),D(n,o))}}catch(V){g(V)}}(S.value)),{flush:a,deep:i,eventFilter:y});function D(t,n){if(v){const o={key:e,oldValue:t,newValue:n,storageArea:r};v.dispatchEvent(r instanceof Storage?new StorageEvent("storage",o):new CustomEvent(T,{detail:o}))}}function J(t){if(!t||t.storageArea===r)if(t&&null==t.key)S.value=h;else if(!t||t.key===e){j();try{(null==t?void 0:t.newValue)!==A.write(S.value)&&(S.value=function(t){const n=t?t.newValue:r.getItem(e);if(null==n)return u&&null!=h&&r.setItem(e,A.write(h)),h;if(!t&&f){const e=A.read(n);return"function"==typeof f?f(e,h):"object"!==O||Array.isArray(e)?e:s(s({},h),e)}return"string"!=typeof n?n:A.read(n)}(t))}catch(V){g(V)}finally{t?c(I):I()}}}function k(e){J(e.detail)}return v&&l&&N((()=>{r instanceof Storage?P(v,"storage",J):P(v,T,k),w&&J()})),w||J(),S}function x(e,t,r={}){const{window:n=E}=r;return V(e,t,null==n?void 0:n.localStorage,r)}export{x as u};
