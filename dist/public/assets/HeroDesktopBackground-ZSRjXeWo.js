import{j as t}from"./index-DZLy5-t_.js";function s(){return t.jsxs("div",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:10",className:"absolute inset-0 z-0 overflow-hidden pointer-events-none",children:[t.jsx("div",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:12",className:"absolute",style:{width:"500px",height:"500px",right:"10%",top:"15%",background:"radial-gradient(circle, rgba(45,212,191,0.06) 0%, rgba(45,212,191,0.02) 40%, transparent 70%)",animation:"deskOrb1 8s ease-in-out infinite"}}),t.jsx("div",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:24",className:"absolute",style:{width:"350px",height:"350px",left:"5%",top:"50%",background:"radial-gradient(circle, rgba(13,148,136,0.05) 0%, transparent 70%)",animation:"deskOrb2 10s ease-in-out infinite"}}),t.jsx("div",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:36",className:"absolute",style:{width:"250px",height:"250px",right:"25%",bottom:"10%",background:"radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 70%)",animation:"deskOrb3 12s ease-in-out infinite"}}),o.map((a,e)=>t.jsx("div",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:51",className:"absolute rounded-full",style:{width:a.size,height:a.size,left:a.x,top:a.y,background:`rgba(45, 212, 191, ${a.opacity})`,boxShadow:`0 0 ${a.glow}px rgba(45, 212, 191, ${a.opacity*.6})`,animation:`deskFloat${a.anim} ${a.duration}s ease-in-out infinite`,animationDelay:`${a.delay}s`}},e)),i.map((a,e)=>t.jsx("div",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:69",className:"absolute",style:{width:a.width,height:"1px",left:a.x,top:a.y,background:`linear-gradient(90deg, transparent, rgba(45,212,191,${a.opacity}), transparent)`,transform:`rotate(${a.angle}deg)`,animation:`deskLinePulse ${a.duration}s ease-in-out infinite`,animationDelay:`${a.delay}s`}},`line-${e}`)),t.jsxs("svg",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:86",className:"absolute inset-0 w-full h-full opacity-[0.015]",xmlns:"http://www.w3.org/2000/svg",children:[t.jsx("defs",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:90",children:t.jsx("pattern",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:91",id:"hexGrid",width:"60",height:"52",patternUnits:"userSpaceOnUse",patternTransform:"rotate(30)",children:t.jsx("path",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:92",d:"M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z",fill:"none",stroke:"rgba(45,212,191,1)",strokeWidth:"0.5"})})}),t.jsx("rect",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:100",width:"100%",height:"100%",fill:"url(#hexGrid)"})]}),t.jsx("style",{"data-loc":"client/src/components/HeroDesktopBackground.tsx:104",children:`
        @keyframes deskFloat1 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(15px, -20px); }
          50% { transform: translate(-10px, -35px); opacity: 0.5; }
          75% { transform: translate(20px, -15px); }
        }
        @keyframes deskFloat2 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(-18px, 12px); }
          50% { transform: translate(10px, 25px); opacity: 0.4; }
          75% { transform: translate(-12px, 8px); }
        }
        @keyframes deskFloat3 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          33% { transform: translate(20px, 10px); opacity: 0.6; }
          66% { transform: translate(-15px, -18px); }
        }
        @keyframes deskLinePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes deskOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(-20px, 15px) scale(1.1); opacity: 0.6; }
        }
        @keyframes deskOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(15px, -20px) scale(1.15); opacity: 0.5; }
        }
        @keyframes deskOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(-10px, 10px) scale(1.08); opacity: 0.7; }
        }
      `})]})}const o=[{x:"12%",y:"18%",size:3,opacity:.45,glow:8,duration:7,delay:0,anim:1},{x:"78%",y:"12%",size:2,opacity:.4,glow:5,duration:8,delay:.5,anim:2},{x:"42%",y:"52%",size:4,opacity:.35,glow:10,duration:9,delay:1,anim:3},{x:"88%",y:"42%",size:2,opacity:.3,glow:5,duration:7.5,delay:1.5,anim:1},{x:"22%",y:"68%",size:3,opacity:.4,glow:7,duration:8.5,delay:.8,anim:2},{x:"62%",y:"28%",size:2,opacity:.45,glow:6,duration:7,delay:2,anim:3},{x:"8%",y:"42%",size:3,opacity:.3,glow:7,duration:9,delay:.3,anim:1},{x:"92%",y:"62%",size:2,opacity:.35,glow:5,duration:8,delay:1.2,anim:2},{x:"52%",y:"8%",size:2,opacity:.4,glow:6,duration:7.5,delay:.7,anim:3},{x:"32%",y:"82%",size:3,opacity:.3,glow:7,duration:8.5,delay:1.8,anim:1},{x:"72%",y:"72%",size:2,opacity:.35,glow:5,duration:9,delay:.4,anim:2},{x:"18%",y:"32%",size:2,opacity:.4,glow:6,duration:7,delay:2.2,anim:3},{x:"55%",y:"65%",size:3,opacity:.3,glow:8,duration:8,delay:.6,anim:1},{x:"85%",y:"22%",size:2,opacity:.35,glow:5,duration:7.5,delay:1.4,anim:2},{x:"38%",y:"38%",size:2,opacity:.4,glow:6,duration:9,delay:1.1,anim:3},{x:"65%",y:"48%",size:3,opacity:.25,glow:7,duration:8.5,delay:2.5,anim:1},{x:"5%",y:"75%",size:2,opacity:.3,glow:5,duration:7,delay:.9,anim:2},{x:"95%",y:"85%",size:2,opacity:.3,glow:5,duration:8,delay:1.7,anim:3}],i=[{x:"8%",y:"22%",width:"120px",angle:25,opacity:.1,duration:6,delay:0},{x:"58%",y:"18%",width:"90px",angle:-15,opacity:.08,duration:7,delay:1},{x:"28%",y:"58%",width:"100px",angle:35,opacity:.07,duration:8,delay:.5},{x:"72%",y:"48%",width:"80px",angle:-30,opacity:.09,duration:6.5,delay:1.5},{x:"18%",y:"78%",width:"95px",angle:10,opacity:.07,duration:7.5,delay:.8},{x:"82%",y:"32%",width:"85px",angle:-20,opacity:.1,duration:6,delay:2},{x:"45%",y:"42%",width:"110px",angle:45,opacity:.06,duration:8,delay:1.2},{x:"65%",y:"72%",width:"75px",angle:-40,opacity:.08,duration:7,delay:.3}];export{s as default};
