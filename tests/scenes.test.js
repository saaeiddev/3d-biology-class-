import test from 'node:test';
import assert from 'node:assert/strict';
import { makeScene } from '../src/scene.js';
import { cells, parts } from '../src/data.js';

// Test the real geometry construction and selection logic without pretending to test WebGL pixels.
test('every specimen constructs finite geometry for its listed structures and isolates selection', () => {
  globalThis.window = { devicePixelRatio: 1 };
  globalThis.matchMedia = () => ({ matches: true });
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.ResizeObserver = class { observe(){} disconnect(){} };
  const root = { addEventListener(){}, removeEventListener(){} };
  const canvas = { style:{}, addEventListener(){}, removeEventListener(){}, setAttribute(){}, getRootNode(){return root}, remove(){} };
  let world;
  const renderer = {domElement:canvas,setPixelRatio(){},setSize(){},render(s){world=s},dispose(){}};
  const container = {clientWidth:800,clientHeight:500,appendChild(){}};
  const view=makeScene(container,()=>{},{rendererFactory:()=>renderer});
  for(const [key, cell] of Object.entries(cells)){
    if (key === 'blood') continue; // The blood specimen is a GLB-only model without a schematic.
    view.show(key);
    const group=world.children.find(c=>c.type==='Group');
    const names=new Set(group.children.map(x=>x.userData.name).filter(Boolean));
    for(const name of cell.parts){assert.ok(parts[name],`${key}: missing explanation ${name}`);assert.ok(names.has(name),`${key}: missing geometry ${name}`)}
    for(const mesh of group.children){mesh.geometry.computeBoundingSphere();const bound=mesh.geometry.boundingSphere;assert.ok(Number.isFinite(bound.radius),`${key}: invalid geometry`)}
    view.select(cell.parts[1]);view.setIsolated(true);
    assert.ok(group.children.filter(o=>o.userData.name && o.visible).every(o=>o.userData.name===cell.parts[1]));
    view.reset();assert.ok(group.children.filter(o=>o.userData.name).every(o=>o.visible));
  }
  view.dispose();
});
