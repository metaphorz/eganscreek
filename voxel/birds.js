// Herons and egrets circling over the Greenway wetland. They are illustrations, not sighting records.
import * as THREE from 'three';
export const FLOCK=[...Array(18).keys()].map(i=>({kind:i%9<4?'heron':'egret',along:.08+((i*.381)%1)*.4,radius:14+((i*17)%26),squash:.55+((i*5)%5)*.09,altitude:7+((i*7)%11),speed:(i%2?1:-1)*(.13+((i*3)%5)*.015),phase:i*1.7}));
const LOOK={heron:{body:0x6e87a4,wing:0x566d8a,bill:0xc99a4a,legs:0x4a4640,flap:2.4},egret:{body:0xf6f6ee,wing:0xeaeae0,bill:0xe6b93a,legs:0x26241f,flap:3.1}};
// A bird's position and heading at time t, in seconds. The route point anchors its loop over the wetland.
export function flightAt(bird,t,center){const a=t*bird.speed+bird.phase,dx=-Math.sin(a)*bird.speed*bird.radius,dz=Math.cos(a)*bird.speed*bird.radius*bird.squash;return {x:center[0]+Math.cos(a)*bird.radius,z:center[1]+Math.sin(a)*bird.radius*bird.squash,y:bird.altitude+Math.sin(a*2)*1.2,yaw:Math.atan2(-dx,-dz)};}
const unit=new THREE.BoxGeometry(1,1,1);
function part(parent,color,sx,sy,sz,x,y,z){const m=new THREE.Mesh(unit,new THREE.MeshBasicMaterial({color}));m.scale.set(sx,sy,sz);m.position.set(x,y,z);parent.add(m);return m;}
// Both fly with the neck folded back and the legs trailing behind, and face -z.
function makeBird(kind){const c=LOOK[kind],g=new THREE.Group();part(g,c.body,.42,.42,1.5,0,0,0);part(g,c.body,.28,.5,.3,0,.3,-.72);part(g,c.body,.3,.26,.46,0,.56,-.92);part(g,c.bill,.09,.09,.62,0,.54,-1.42);part(g,c.legs,.08,.08,1.2,-.1,-.04,1.3);part(g,c.legs,.08,.08,1.2,.1,-.04,1.3);
 const wings=[-1,1].map(side=>{const pivot=new THREE.Group();pivot.position.set(side*.2,.12,-.05);part(pivot,c.wing,1.2,.08,.95,side*.6,0,0);part(pivot,c.wing,1,.07,.62,side*1.7,0,.08);g.add(pivot);return {pivot,side};});return {group:g,wings,flap:c.flap};}
export function addBirds(scene,world){return FLOCK.map(bird=>{const made=makeBird(bird.kind);scene.add(made.group);return {...made,bird,center:world.routePoint(world.routeLength*bird.along)};});}
export function moveBirds(flock,t,still){for(const {group,wings,flap,bird,center} of flock){const p=flightAt(bird,still?0:t,center);group.position.set(p.x,p.y,p.z);group.rotation.y=p.yaw;const beat=still?.12:Math.sin(t*flap+bird.phase)*.48;for(const {pivot,side} of wings)pivot.rotation.z=side*beat;}}
