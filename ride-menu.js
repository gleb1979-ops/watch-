/* A temporary ride picker: the park stays unobstructed until the player asks for it. */
window.createRideMenu=function({onReveal}){
 const card=document.querySelector('.ride-card'),button=document.createElement('button');button.id='rides-toggle';button.textContent='Rides';button.setAttribute('aria-controls','ride-picker');button.setAttribute('aria-expanded','false');card.id='ride-picker';card.hidden=true;document.querySelector('.top-actions').prepend(button);
 let clock=0,expires=0,hover=false;function close(){hover=false;document.body.classList.remove('ride-menu-open');card.hidden=true;button.setAttribute('aria-expanded','false');}
 function open(){document.body.classList.add('ride-menu-open');card.hidden=false;expires=clock+7;button.setAttribute('aria-expanded','true');onReveal?.();}
 document.addEventListener('park-panel-open',close);button.onclick=()=>card.hidden?open():close();card.addEventListener('pointerenter',()=>hover=true);card.addEventListener('pointerleave',()=>hover=false);document.addEventListener('click',e=>{if(e.target.closest?.('[data-course]'))close();});
 return{open,close,update(dt){clock+=dt;if(!card.hidden&&clock>expires&&!hover&&!card.contains(document.activeElement))close();},get snapshot(){return{open:!card.hidden,remaining:Math.max(0,expires-clock)};}};
};
