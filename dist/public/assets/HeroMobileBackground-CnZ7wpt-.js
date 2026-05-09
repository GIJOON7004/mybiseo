import{j as t}from"./index-BbEjXR0K.js";function r(){return t.jsxs("div",{"data-loc":"client/src/components/HeroMobileBackground.tsx:10",className:"absolute inset-0 z-0 overflow-hidden pointer-events-none",children:[t.jsx("div",{"data-loc":"client/src/components/HeroMobileBackground.tsx:12",className:"absolute inset-0",style:{background:"radial-gradient(ellipse 60% 50% at 30% 40%, rgba(45,212,191,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 70% 60%, rgba(13,148,136,0.06) 0%, transparent 70%)"}}),o.map((a,e)=>t.jsx("div",{"data-loc":"client/src/components/HeroMobileBackground.tsx:23",className:"absolute rounded-full",style:{width:a.size,height:a.size,left:a.x,top:a.y,background:`rgba(45, 212, 191, ${a.opacity})`,boxShadow:`0 0 ${a.glow}px rgba(45, 212, 191, ${a.opacity*.5})`,animation:`mobileFloat${a.anim} ${a.duration}s ease-in-out infinite`,animationDelay:`${a.delay}s`}},e)),i.map((a,e)=>t.jsx("div",{"data-loc":"client/src/components/HeroMobileBackground.tsx:41",className:"absolute",style:{width:a.width,height:"1px",left:a.x,top:a.y,background:`linear-gradient(90deg, transparent, rgba(45,212,191,${a.opacity}), transparent)`,transform:`rotate(${a.angle}deg)`,animation:`mobileLinePulse ${a.duration}s ease-in-out infinite`,animationDelay:`${a.delay}s`}},`line-${e}`)),t.jsx("div",{"data-loc":"client/src/components/HeroMobileBackground.tsx:58",className:"absolute",style:{width:"120px",height:"120px",left:"50%",top:"35%",transform:"translate(-50%, -50%)",background:"radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)",animation:"mobileCorePulse 4s ease-in-out infinite"}}),t.jsx("style",{"data-loc":"client/src/components/HeroMobileBackground.tsx:73",children:`
        @keyframes mobileFloat1 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(8px, -12px); }
          50% { transform: translate(-5px, -20px); opacity: 0.6; }
          75% { transform: translate(10px, -8px); }
        }
        @keyframes mobileFloat2 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(-10px, 8px); }
          50% { transform: translate(6px, 15px); opacity: 0.5; }
          75% { transform: translate(-8px, 5px); }
        }
        @keyframes mobileFloat3 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          33% { transform: translate(12px, 6px); opacity: 0.7; }
          66% { transform: translate(-8px, -10px); }
        }
        @keyframes mobileLinePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes mobileCorePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.5; }
        }
      `})]})}const o=[{x:"15%",y:"20%",size:3,opacity:.5,glow:6,duration:6,delay:0,anim:1},{x:"75%",y:"15%",size:2,opacity:.4,glow:4,duration:7,delay:.5,anim:2},{x:"40%",y:"55%",size:4,opacity:.35,glow:8,duration:8,delay:1,anim:3},{x:"85%",y:"45%",size:2,opacity:.3,glow:4,duration:6.5,delay:1.5,anim:1},{x:"25%",y:"70%",size:3,opacity:.4,glow:6,duration:7.5,delay:.8,anim:2},{x:"60%",y:"30%",size:2,opacity:.45,glow:5,duration:6,delay:2,anim:3},{x:"10%",y:"45%",size:3,opacity:.3,glow:6,duration:8,delay:.3,anim:1},{x:"90%",y:"65%",size:2,opacity:.35,glow:4,duration:7,delay:1.2,anim:2},{x:"50%",y:"10%",size:2,opacity:.4,glow:5,duration:6.5,delay:.7,anim:3},{x:"35%",y:"85%",size:3,opacity:.3,glow:6,duration:7.5,delay:1.8,anim:1},{x:"70%",y:"75%",size:2,opacity:.35,glow:4,duration:8,delay:.4,anim:2},{x:"20%",y:"35%",size:2,opacity:.4,glow:5,duration:6,delay:2.2,anim:3}],i=[{x:"10%",y:"25%",width:"80px",angle:25,opacity:.12,duration:5,delay:0},{x:"55%",y:"20%",width:"60px",angle:-15,opacity:.1,duration:6,delay:1},{x:"30%",y:"60%",width:"70px",angle:35,opacity:.08,duration:7,delay:.5},{x:"70%",y:"50%",width:"50px",angle:-30,opacity:.1,duration:5.5,delay:1.5},{x:"20%",y:"80%",width:"65px",angle:10,opacity:.09,duration:6.5,delay:.8},{x:"80%",y:"35%",width:"55px",angle:-20,opacity:.11,duration:5,delay:2}];export{r as default};
