import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {Box3, Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

// Decode all local models with the production loader; image decoding and rasterization are not exercised here.
globalThis.self=globalThis;
globalThis.createImageBitmap=async ()=>({width:1,height:1,close(){}});
for(const name of ['animal','plant','bacteria','neuron','blood-cells','retina-cajal','purkinje-cajal']) test(`${name} asset is a self-contained, nonempty GLB`,async()=>{
  const data=gunzipSync(readFileSync(`public/models/${name}.glb.gz`));
  assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);
  const model=await new Promise((resolve,reject)=>new GLTFLoader().parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'',resolve,reject));
  let triangles=0;model.scene.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3});
  assert.ok(triangles>100000,`Expected detailed geometry; received ${triangles} triangles`);
  const size=new Box3().setFromObject(model.scene).getSize(new Vector3());assert.ok(size.length()>0);
});

test('production loader decompresses and installs the local neuron model',async()=>{
  const {makeScene}=await import('../src/scene.js');
  globalThis.window={devicePixelRatio:1}; globalThis.matchMedia=()=>({matches:true});
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  globalThis.ResizeObserver=class{observe(){} disconnect(){}};
  const root={addEventListener(){},removeEventListener(){}};
  const canvas={style:{},addEventListener(){},removeEventListener(){},setAttribute(){},getRootNode(){return root},remove(){}};
  let world;const renderer={domElement:canvas,setPixelRatio(){},setSize(){},render(s){world=s},dispose(){}};
  const container={clientWidth:800,clientHeight:500,appendChild(){}};
  // Exercise the actual async loader branch with an injected renderer and local network response.
  const oldFetch=globalThis.fetch;globalThis.fetch=async url=>typeof url==='string'&&url.endsWith('neuron.glb.gz')?new Response(readFileSync('public/models/neuron.glb.gz')):oldFetch(url);
  let resolveStatus;const ready=new Promise(resolve=>resolveStatus=resolve);
  const view=makeScene(container,()=>{},{rendererFactory:()=>renderer,initial:false,onStatus:s=>{if(s==='ready'||s==='error')resolveStatus(s)},testAssetLoading:true});
  view.show('neuron');assert.equal(await ready,'ready');
  const group=world.children.find(c=>c.type==='Group');let meshes=0;group.traverse(o=>{if(o.isMesh)meshes++});assert.ok(meshes>0);
  view.dispose();globalThis.fetch=oldFetch;
});
