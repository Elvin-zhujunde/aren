import{_ as e,u as a}from"./index-Cbz38BXK.js";import{U as s,a1 as l,X as t,Y as o,u as i,F as n,a2 as c,q as r,W as d,I as u,a3 as m,V as v,_ as k,S as p,r as y,j as h}from"./vue-vendor-DWkQNG0n.js";import{B as f,G as g,b,T as _,c as w,_ as F,d as C,e as $,f as j,g as I,h as x,i as E,R as U,j as D,k as z,l as B,m as M,n as S,P as V,E as W,I as X,o as A,p as G,F as H}from"./antd-f4A_rnAp.js";import"./vueuse-CmjCXjo4.js";const N={class:"hero"},P={class:"content"},R={class:"text-content"},q={class:"subtitle"},L={class:"title"},T={class:"description"},Q={class:"roles"},Y={class:"cta-group"},J={class:"social-links"},K={class:"stats-cards"},O={class:"stat-number"},Z={class:"stat-label"},ee={class:"scroll-indicator"},ae={class:"scroll-text"},se=e({__name:"Hero",setup(e){const{t:p}=a(),y=["designer","developer","wordpress"],h=[{key:"github",icon:g,title:"GitHub",color:"#24292e"},{key:"linkedin",icon:b,title:"LinkedIn",color:"#0077b5"},{key:"twitter",icon:_,title:"Twitter",color:"#1da1f2"},{key:"behance",icon:w,title:"Behance",color:"#1769ff"}],C=[{key:"experience",number:"5"},{key:"projects",number:"50"},{key:"clients",number:"30"}];return(e,a)=>{const g=f,b=F;return s(),l("div",N,[t("div",P,[t("div",R,[t("h3",q,o(i(p)("home.hero.hey")),1),t("h1",L,o(i(p)("home.hero.name")),1),t("p",T,o(i(p)("home.hero.description")),1),t("div",Q,[(s(),l(n,null,c(y,((e,a)=>t("div",{key:a,class:"role-item"},o(i(p)(`home.hero.roles.${e}`)),1))),64))]),t("div",Y,[r(g,{type:"primary",size:"large",class:"cta-button"},{default:d((()=>[u(o(i(p)("home.hero.contact")),1)])),_:1}),r(g,{size:"large",class:"cta-button-secondary"},{default:d((()=>[u(o(i(p)("home.hero.download")),1)])),_:1})]),t("div",J,[(s(),l(n,null,c(h,(e=>r(b,{key:e.key,title:e.title},{default:d((()=>[t("div",{class:"social-icon",style:m({backgroundColor:e.color})},[(s(),v(k(e.icon)))],4)])),_:2},1032,["title"]))),64))])]),t("div",K,[(s(),l(n,null,c(C,(e=>t("div",{key:e.key,class:"stat-card"},[t("div",O,o(e.number)+"+",1),t("div",Z,o(i(p)(`home.hero.stats.${e.key}`)),1)]))),64))])]),t("div",ee,[a[0]||(a[0]=t("div",{class:"mouse"},[t("div",{class:"wheel"})],-1)),t("div",ae,o(i(p)("home.hero.scroll")),1)])])}}},[["__scopeId","data-v-5d1efb1f"]]),le={class:"works-section"},te={class:"section-header"},oe={class:"works-filter"},ie={class:"works-grid"},ne=["data-aos","onClick"],ce={class:"work-overlay"},re={class:"work-category"},de={class:"work-info"},ue={class:"work-tags"},me={class:"works-more"},ve=e({__name:"Works",setup(e){const{t:k}=a(),g=p(),b=[{key:"all",label:"All"},{key:"design",label:"Design"},{key:"development",label:"Development"},{key:"mobile",label:"Mobile"}],_=y("all"),w=[{id:1,key:"dashboard",category:"design",bgColor:"#FFE0E0",tags:["UI/UX","Figma","Dashboard"],animation:"fade-up"},{id:2,key:"ecommerce",category:"development",bgColor:"#E0F0FF",tags:["Vue.js","Node.js","MongoDB"],animation:"fade-up"},{id:3,key:"fitness",category:"mobile",bgColor:"#E0FFE0",tags:["React Native","Firebase"],animation:"fade-up"},{id:4,key:"social",category:"development",bgColor:"#F0E0FF",tags:["Vue.js","GraphQL","AWS"],animation:"fade-up"},{id:5,key:"travel",category:"mobile",bgColor:"#FFE0B0",tags:["Flutter","Firebase"],animation:"fade-up"},{id:6,key:"portfolio",category:"design",bgColor:"#E0FFE0",tags:["UI/UX","Web Design"],animation:"fade-up"}],F=h((()=>"all"===_.value?w:w.filter((e=>e.category===_.value))));return(e,a)=>{const p=j,y=C,h=f,w=I,E=x,U=$;return s(),l("div",le,[t("div",te,[t("h2",null,o(i(k)("home.works.title")),1),t("p",null,o(i(k)("home.works.subtitle")),1)]),t("div",oe,[r(y,{value:_.value,"onUpdate:value":a[0]||(a[0]=e=>_.value=e),"button-style":"solid"},{default:d((()=>[(s(),l(n,null,c(b,(e=>r(p,{key:e.key,value:e.key},{default:d((()=>[u(o(i(k)(`home.works.categories.${e.key}`)),1)])),_:2},1032,["value"]))),64))])),_:1},8,["value"])]),t("div",ie,[r(U,{gutter:[24,24]},{default:d((()=>[(s(!0),l(n,null,c(F.value,(e=>(s(),v(E,{key:e.id,xs:24,sm:12,md:8},{default:d((()=>[t("div",{class:"work-card","data-aos":e.animation,onClick:a=>(e=>{g.push({name:"portfolio-details",query:{id:e.id}})})(e)},[t("div",{class:"work-image",style:m({backgroundColor:e.bgColor})},[t("div",ce,[r(h,{type:"primary",shape:"round"},{default:d((()=>[u(o(i(k)("home.works.viewDetails")),1)])),_:1})]),t("span",re,o(i(k)(`home.works.categories.${e.category}`)),1)],4),t("div",de,[t("h3",null,o(i(k)(`home.works.items.${e.key}.title`)),1),t("p",null,o(i(k)(`home.works.items.${e.key}.description`)),1),t("div",ue,[(s(!0),l(n,null,c(e.tags,(e=>(s(),v(w,{key:e},{default:d((()=>[u(o(e),1)])),_:2},1024)))),128))])])],8,ne)])),_:2},1024)))),128))])),_:1})]),t("div",me,[r(h,{type:"primary",shape:"round",size:"large"},{default:d((()=>[u(o(i(k)("home.works.viewMore")),1)])),_:1})])])}}},[["__scopeId","data-v-8c09d889"]]),ke={class:"services-section"},pe={class:"section-header"},ye={class:"services-grid"},he=["data-aos","data-aos-delay"],fe={class:"service-icon-wrapper"},ge={class:"service-features"},be={class:"services-cta"},_e=e({__name:"Services",setup(e){const{t:p}=a(),y=[{key:"design",icon:D,color:"#1890ff",features:["responsive","userCentric","modern"],animation:"fade-up",delay:"0"},{key:"development",icon:z,color:"#52c41a",features:["performance","scalable","secure"],animation:"fade-up",delay:"200"},{key:"mobile",icon:B,color:"#722ed1",features:["native","crossPlatform","offline"],animation:"fade-up",delay:"400"}];return(e,a)=>{const h=f,g=x,b=$;return s(),l("div",ke,[t("div",pe,[t("h2",null,o(i(p)("home.services.title")),1),t("p",null,o(i(p)("home.services.subtitle")),1)]),t("div",ye,[r(b,{gutter:[32,32]},{default:d((()=>[(s(),l(n,null,c(y,(e=>r(g,{key:e.key,xs:24,sm:12,md:8},{default:d((()=>[t("div",{class:"service-card","data-aos":e.animation,"data-aos-delay":e.delay},[t("div",fe,[t("div",{class:"service-icon",style:m({backgroundColor:e.color})},[(s(),v(k(e.icon)))],4),t("div",{class:"service-icon-bg",style:m({backgroundColor:e.color})},null,4)]),t("h3",null,o(i(p)(`home.services.items.${e.key}.title`)),1),t("p",null,o(i(p)(`home.services.items.${e.key}.description`)),1),t("ul",ge,[(s(!0),l(n,null,c(e.features,((a,t)=>(s(),l("li",{key:t},[r(i(E),{class:"feature-icon"}),u(" "+o(i(p)(`home.services.items.${e.key}.features.${a}`)),1)])))),128))]),r(h,{type:"link",class:"learn-more"},{default:d((()=>[u(o(i(p)("home.services.learnMore"))+" ",1),r(i(U))])),_:1})],8,he)])),_:2},1024))),64))])),_:1})]),t("div",be,[t("h3",null,o(i(p)("home.services.cta.title")),1),t("p",null,o(i(p)("home.services.cta.description")),1),r(h,{type:"primary",size:"large",shape:"round"},{default:d((()=>[u(o(i(p)("home.services.cta.button")),1)])),_:1})])])}}},[["__scopeId","data-v-ec59b630"]]),we={class:"skills-section"},Fe={class:"section-header"},Ce={class:"skills-grid"},$e={class:"skill-category"},je={class:"skill-list"},Ie={class:"skill-info"},xe={class:"skill-name"},Ee={class:"skill-percentage"},Ue=e({__name:"Skills",setup(e){const{t:u}=a(),m=[{key:"design",skills:[{name:"Figma",percentage:90},{name:"Adobe XD",percentage:85},{name:"Photoshop",percentage:80}]},{key:"development",skills:[{name:"Vue.js",percentage:95},{name:"React",percentage:85},{name:"Node.js",percentage:80}]}];return(e,a)=>{const v=M,k=x,p=$;return s(),l("div",we,[t("div",Fe,[t("h2",null,o(i(u)("home.skills.title")),1),t("p",null,o(i(u)("home.skills.subtitle")),1)]),t("div",Ce,[r(p,{gutter:[24,24]},{default:d((()=>[(s(),l(n,null,c(m,((e,a)=>r(k,{key:a,xs:24,md:12},{default:d((()=>[t("div",$e,[t("h3",null,o(i(u)(`home.skills.categories.${e.key}.title`)),1),t("div",je,[(s(!0),l(n,null,c(e.skills,(e=>(s(),l("div",{key:e.name,class:"skill-item"},[t("div",Ie,[t("span",xe,o(e.name),1),t("span",Ee,o(e.percentage)+"%",1)]),r(v,{percent:e.percentage,"show-info":!1},null,8,["percent"])])))),128))])])])),_:2},1024))),64))])),_:1})])])}}},[["__scopeId","data-v-c72b6bc7"]]),De={class:"contact-section"},ze={class:"section-header"},Be={class:"contact-content"},Me={class:"contact-info"},Se={class:"icon-wrapper"},Ve={class:"info"},We=e({__name:"Contact",setup(e){const{t:m}=a(),p=[{key:"email",icon:S},{key:"phone",icon:V},{key:"address",icon:W}],h=y({name:"",email:"",message:""}),g=e=>{};return(e,a)=>{const y=x,b=X,_=A,w=G,F=f,C=H,j=$;return s(),l("div",De,[t("div",ze,[t("h2",null,o(i(m)("home.contact.title")),1),t("p",null,o(i(m)("home.contact.subtitle")),1)]),t("div",Be,[r(j,{gutter:[48,48]},{default:d((()=>[r(y,{xs:24,md:12},{default:d((()=>[t("div",Me,[(s(),l(n,null,c(p,(e=>t("div",{key:e.key,class:"contact-item"},[t("div",Se,[(s(),v(k(e.icon)))]),t("div",Ve,[t("h4",null,o(i(m)(`home.contact.items.${e.key}.title`)),1),t("p",null,o(i(m)(`home.contact.items.${e.key}.content`)),1)])]))),64))])])),_:1}),r(y,{xs:24,md:12},{default:d((()=>[r(C,{model:h.value,onFinish:g,layout:"vertical"},{default:d((()=>[r(_,{name:"name",label:i(m)("home.contact.form.name")},{default:d((()=>[r(b,{value:h.value.name,"onUpdate:value":a[0]||(a[0]=e=>h.value.name=e)},null,8,["value"])])),_:1},8,["label"]),r(_,{name:"email",label:i(m)("home.contact.form.email")},{default:d((()=>[r(b,{value:h.value.email,"onUpdate:value":a[1]||(a[1]=e=>h.value.email=e)},null,8,["value"])])),_:1},8,["label"]),r(_,{name:"message",label:i(m)("home.contact.form.message")},{default:d((()=>[r(w,{value:h.value.message,"onUpdate:value":a[2]||(a[2]=e=>h.value.message=e),rows:4},null,8,["value"])])),_:1},8,["label"]),r(_,null,{default:d((()=>[r(F,{type:"primary","html-type":"submit",block:""},{default:d((()=>[u(o(i(m)("home.contact.form.submit")),1)])),_:1})])),_:1})])),_:1},8,["model"])])),_:1})])),_:1})])])}}},[["__scopeId","data-v-5f6fed3a"]]),Xe={class:"home-container"},Ae=e({__name:"Home",setup:e=>(e,a)=>(s(),l("div",Xe,[r(se),r(ve),r(_e),r(Ue),r(We)]))},[["__scopeId","data-v-38d6aaf1"]]);export{Ae as default};
