'use strict';
// Approved bases: preserve artworks, remove the baked-in dark rectangular background.
(function(){
  const files={A:'base_A_red.webp',B:'base_B_blue.webp',C:'base_C_green.webp',D:'base_D_purple.webp'};
  const style=document.createElement('style');
  style.textContent=`
    .base{width:190px!important;height:174px!important;overflow:visible!important;isolation:isolate!important;background:transparent!important;border:0!important;box-shadow:none!important}
    .base:before{content:''!important;display:block!important;position:absolute!important;inset:0!important;background-image:var(--approved-base)!important;background-position:center!important;background-repeat:no-repeat!important;background-size:contain!important;-webkit-mask-image:none!important;mask-image:none!important;filter:none!important;pointer-events:none!important;z-index:1!important}
    .base:after{display:none!important;content:none!important}
    .base .baseMeta{z-index:8!important}
  `;
  document.head.appendChild(style);

  // Remove only the near-neutral, charcoal-colored background region connected
  // to the image's outside edge. Preserve details within the bases and piers.
  function removeBackground(img){
    const canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,0,0);
    const image=ctx.getImageData(0,0,canvas.width,canvas.height);
    const pixels=image.data,w=canvas.width,h=canvas.height,n=w*h;
    const visited=new Uint8Array(n),queue=new Int32Array(n);
    let head=0,tail=0;
    function candidate(i){
      const k=i*4,r=pixels[k],g=pixels[k+1],b=pixels[k+2];
      const max=Math.max(r,g,b),min=Math.min(r,g,b);
      return max<84 && max-min<19;
    }
    function push(i){
      if(!visited[i] && candidate(i)){visited[i]=1;queue[tail++]=i;}
    }
    for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}
    for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
    while(head<tail){
      const i=queue[head++],x=i%w;
      if(x>0)push(i-1);
      if(x<w-1)push(i+1);
      if(i>=w)push(i-w);
      if(i+w<n)push(i+w);
    }
    // Antialias border pixels, without introducing opaque dark backing.
    for(let i=0;i<n;i++){
      if(!visited[i])continue;
      pixels[i*4+3]=0;
    }
    ctx.putImageData(image,0,0);
    return canvas.toDataURL('image/png');
  }
  for(const [id,file] of Object.entries(files)){
    const el=document.querySelector('.base[data-base="'+id+'"]');
    if(!el)continue;
    const img=new Image();
    img.onload=()=>{
      try{el.style.setProperty('--approved-base','url("'+removeBackground(img)+'")');}
      catch(err){console.error('Approved base image rendering error',id,err);}
    };
    img.src='art/'+file;
  }
})();
