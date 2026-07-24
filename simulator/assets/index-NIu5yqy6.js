(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{__destroy_into_raw(){let e=this.__wbg_ptr;return this.__wbg_ptr=0,n.unregister(this),e}free(){let e=this.__destroy_into_raw();b.__wbg_wmlengine_free(e,0)}activeCardId(){let e,t;try{let i=b.wmlengine_activeCardId(this.__wbg_ptr);var n=i[0],r=i[1];if(i[3])throw n=0,r=0,h(i[2]);return e=n,t=r,c(n,r)}finally{b.__wbindgen_free(e,t,1)}}advanceTimeMs(e){let t=b.wmlengine_advanceTimeMs(this.__wbg_ptr,e);if(t[1])throw h(t[0])}baseUrl(){let e,t;try{let n=b.wmlengine_baseUrl(this.__wbg_ptr);return e=n[0],t=n[1],c(n[0],n[1])}finally{b.__wbindgen_free(e,t,1)}}beginFocusedInputEdit(){let e=b.wmlengine_beginFocusedInputEdit(this.__wbg_ptr);if(e[2])throw h(e[1]);return e[0]!==0}beginFocusedSelectEdit(){let e=b.wmlengine_beginFocusedSelectEdit(this.__wbg_ptr);if(e[2])throw h(e[1]);return e[0]!==0}cancelFocusedInputEdit(){return b.wmlengine_cancelFocusedInputEdit(this.__wbg_ptr)!==0}cancelFocusedSelectEdit(){return b.wmlengine_cancelFocusedSelectEdit(this.__wbg_ptr)!==0}clearExternalNavigationIntent(){b.wmlengine_clearExternalNavigationIntent(this.__wbg_ptr)}clearScriptEntryPoints(){b.wmlengine_clearScriptEntryPoints(this.__wbg_ptr)}clearScriptUnits(){b.wmlengine_clearScriptUnits(this.__wbg_ptr)}clearTraceEntries(){b.wmlengine_clearTraceEntries(this.__wbg_ptr)}commitFocusedInputEdit(){let e=b.wmlengine_commitFocusedInputEdit(this.__wbg_ptr);if(e[2])throw h(e[1]);return e[0]!==0}commitFocusedSelectEdit(){let e=b.wmlengine_commitFocusedSelectEdit(this.__wbg_ptr);if(e[2])throw h(e[1]);return e[0]!==0}contentType(){let e,t;try{let n=b.wmlengine_contentType(this.__wbg_ptr);return e=n[0],t=n[1],c(n[0],n[1])}finally{b.__wbindgen_free(e,t,1)}}executeScriptRef(e){let t=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),n=y,r=b.wmlengine_executeScriptRef(this.__wbg_ptr,t,n);if(r[2])throw h(r[1]);return h(r[0])}executeScriptRefCall(e,t,n){let r=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),i=y,a=m(t,b.__wbindgen_malloc,b.__wbindgen_realloc),o=y,s=b.wmlengine_executeScriptRefCall(this.__wbg_ptr,r,i,a,o,n);if(s[2])throw h(s[1]);return h(s[0])}executeScriptRefFunction(e,t){let n=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),r=y,i=m(t,b.__wbindgen_malloc,b.__wbindgen_realloc),a=y,o=b.wmlengine_executeScriptRefFunction(this.__wbg_ptr,n,r,i,a);if(o[2])throw h(o[1]);return h(o[0])}executeScriptUnit(e){let t=p(e,b.__wbindgen_malloc),n=y,r=b.wmlengine_executeScriptUnit(this.__wbg_ptr,t,n);if(r[2])throw h(r[1]);return h(r[0])}externalNavigationIntent(){let e=b.wmlengine_externalNavigationIntent(this.__wbg_ptr),t;return e[0]!==0&&(t=c(e[0],e[1]).slice(),b.__wbindgen_free(e[0],e[1]*1,1)),t}externalNavigationRequestPolicy(){let e=b.wmlengine_externalNavigationRequestPolicy(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}focusedInputEditName(){let e=b.wmlengine_focusedInputEditName(this.__wbg_ptr),t;return e[0]!==0&&(t=c(e[0],e[1]).slice(),b.__wbindgen_free(e[0],e[1]*1,1)),t}focusedInputEditValue(){let e=b.wmlengine_focusedInputEditValue(this.__wbg_ptr),t;return e[0]!==0&&(t=c(e[0],e[1]).slice(),b.__wbindgen_free(e[0],e[1]*1,1)),t}focusedLinkIndex(){return b.wmlengine_focusedLinkIndex(this.__wbg_ptr)>>>0}focusedSelectEditName(){let e=b.wmlengine_focusedSelectEditName(this.__wbg_ptr),t;return e[0]!==0&&(t=c(e[0],e[1]).slice(),b.__wbindgen_free(e[0],e[1]*1,1)),t}focusedSelectEditValue(){let e=b.wmlengine_focusedSelectEditValue(this.__wbg_ptr),t;return e[0]!==0&&(t=c(e[0],e[1]).slice(),b.__wbindgen_free(e[0],e[1]*1,1)),t}getVar(e){let t=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),n=y,r=b.wmlengine_getVar(this.__wbg_ptr,t,n),i;return r[0]!==0&&(i=c(r[0],r[1]).slice(),b.__wbindgen_free(r[0],r[1]*1,1)),i}handleKey(e){let t=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),n=y,r=b.wmlengine_handleKey(this.__wbg_ptr,t,n);if(r[1])throw h(r[0])}invokeScriptRef(e){let t=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),n=y,r=b.wmlengine_invokeScriptRef(this.__wbg_ptr,t,n);if(r[2])throw h(r[1]);return h(r[0])}invokeScriptRefCall(e,t,n){let r=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),i=y,a=m(t,b.__wbindgen_malloc,b.__wbindgen_realloc),o=y,s=b.wmlengine_invokeScriptRefCall(this.__wbg_ptr,r,i,a,o,n);if(s[2])throw h(s[1]);return h(s[0])}invokeScriptRefFunction(e,t){let n=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),r=y,i=m(t,b.__wbindgen_malloc,b.__wbindgen_realloc),a=y,o=b.wmlengine_invokeScriptRefFunction(this.__wbg_ptr,n,r,i,a);if(o[2])throw h(o[1]);return h(o[0])}lastScriptDialogRequests(){let e=b.wmlengine_lastScriptDialogRequests(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}lastScriptExecutionErrorCategory(){let e=b.wmlengine_lastScriptExecutionErrorCategory(this.__wbg_ptr),t;return e[0]!==0&&(t=c(e[0],e[1]).slice(),b.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptExecutionErrorClass(){let e=b.wmlengine_lastScriptExecutionErrorClass(this.__wbg_ptr),t;return e[0]!==0&&(t=c(e[0],e[1]).slice(),b.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptExecutionOk(){let e=b.wmlengine_lastScriptExecutionOk(this.__wbg_ptr);return e===16777215?void 0:e!==0}lastScriptExecutionTrap(){let e=b.wmlengine_lastScriptExecutionTrap(this.__wbg_ptr),t;return e[0]!==0&&(t=c(e[0],e[1]).slice(),b.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptRequiresRefresh(){let e=b.wmlengine_lastScriptRequiresRefresh(this.__wbg_ptr);return e===16777215?void 0:e!==0}lastScriptTimerRequests(){let e=b.wmlengine_lastScriptTimerRequests(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}loadDeck(e){let t=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),n=y,r=b.wmlengine_loadDeck(this.__wbg_ptr,t,n);if(r[1])throw h(r[0])}loadDeckContext(e,t,n,r){let i=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),a=y,o=m(t,b.__wbindgen_malloc,b.__wbindgen_realloc),s=y,c=m(n,b.__wbindgen_malloc,b.__wbindgen_realloc),l=y;var u=f(r)?0:m(r,b.__wbindgen_malloc,b.__wbindgen_realloc),d=y;let p=b.wmlengine_loadDeckContext(this.__wbg_ptr,i,a,o,s,c,l,u,d);if(p[1])throw h(p[0])}moveFocusedSelectEdit(e){return b.wmlengine_moveFocusedSelectEdit(this.__wbg_ptr,e)!==0}navigateBack(){return b.wmlengine_navigateBack(this.__wbg_ptr)!==0}navigateToCard(e){let t=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),n=y,r=b.wmlengine_navigateToCard(this.__wbg_ptr,t,n);if(r[1])throw h(r[0])}registerScriptEntryPoint(e,t,n){let r=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),i=y,a=m(t,b.__wbindgen_malloc,b.__wbindgen_realloc),o=y;b.wmlengine_registerScriptEntryPoint(this.__wbg_ptr,r,i,a,o,n)}registerScriptUnit(e,t){let n=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),r=y,i=p(t,b.__wbindgen_malloc),a=y;b.wmlengine_registerScriptUnit(this.__wbg_ptr,n,r,i,a)}render(){let e=b.wmlengine_render(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}setFocusedInputEditDraft(e){let t=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),n=y;return b.wmlengine_setFocusedInputEditDraft(this.__wbg_ptr,t,n)!==0}setVar(e,t){let n=m(e,b.__wbindgen_malloc,b.__wbindgen_realloc),r=y,i=m(t,b.__wbindgen_malloc,b.__wbindgen_realloc),a=y;return b.wmlengine_setVar(this.__wbg_ptr,n,r,i,a)!==0}setViewportCols(e){b.wmlengine_setViewportCols(this.__wbg_ptr,e)}traceEntries(){let e=b.wmlengine_traceEntries(this.__wbg_ptr);if(e[2])throw h(e[1]);return h(e[0])}constructor(){let e=b.wmlengine_wasm_new();return this.__wbg_ptr=e,n.register(this,this.__wbg_ptr,this),this}};Symbol.dispose&&(e.prototype[Symbol.dispose]=e.prototype.free);function t(){return{__proto__:null,"./wavenav_engine_bg.js":{__proto__:null,__wbg_Error_92b29b0548f8b746:function(e,t){return Error(c(e,t))},__wbg_String_8564e559799eccda:function(e,t){let n=m(String(t),b.__wbindgen_malloc,b.__wbindgen_realloc),r=y;s().setInt32(e+4,r,!0),s().setInt32(e+0,n,!0)},__wbg___wbindgen_bigint_get_as_i64_d968e41184ae354f:function(e,t){let n=t,r=typeof n==`bigint`?n:void 0;s().setBigInt64(e+8,f(r)?BigInt(0):r,!0),s().setInt32(e+0,!f(r),!0)},__wbg___wbindgen_boolean_get_fa956cfa2d1bd751:function(e){let t=e,n=typeof t==`boolean`?t:void 0;return f(n)?16777215:+!!n},__wbg___wbindgen_debug_string_c25d447a39f5578f:function(e,t){let n=m(i(t),b.__wbindgen_malloc,b.__wbindgen_realloc),r=y;s().setInt32(e+4,r,!0),s().setInt32(e+0,n,!0)},__wbg___wbindgen_in_aca499c5de7ff5e5:function(e,t){return e in t},__wbg___wbindgen_is_bigint_2f76dc55065b4273:function(e){return typeof e==`bigint`},__wbg___wbindgen_is_function_1ff95bcc5517c252:function(e){return typeof e==`function`},__wbg___wbindgen_is_object_a27215656b807791:function(e){let t=e;return typeof t==`object`&&!!t},__wbg___wbindgen_jsval_eq_e659fcf7b0e32763:function(e,t){return e===t},__wbg___wbindgen_jsval_loose_eq_db4c3b15f63fc170:function(e,t){return e==t},__wbg___wbindgen_number_get_394265ed1e1b84ee:function(e,t){let n=t,r=typeof n==`number`?n:void 0;s().setFloat64(e+8,f(r)?0:r,!0),s().setInt32(e+0,!f(r),!0)},__wbg___wbindgen_string_get_b0ca35b86a603356:function(e,t){let n=t,r=typeof n==`string`?n:void 0;var i=f(r)?0:m(r,b.__wbindgen_malloc,b.__wbindgen_realloc),a=y;s().setInt32(e+4,a,!0),s().setInt32(e+0,i,!0)},__wbg___wbindgen_throw_344f42d3211c4765:function(e,t){throw Error(c(e,t))},__wbg_call_8a2dd23819f8a60a:function(){return d(function(e,t){return e.call(t)},arguments)},__wbg_done_89b2b13e91a60321:function(e){return e.done},__wbg_entries_015dc610cd81ede0:function(e){return Object.entries(e)},__wbg_get_507a50627bffa49b:function(e,t){return e[t>>>0]},__wbg_get_c7eb1f358a7654df:function(){return d(function(e,t){return Reflect.get(e,t)},arguments)},__wbg_get_unchecked_6e0ad6d2a41b06f6:function(e,t){return e[t>>>0]},__wbg_instanceof_ArrayBuffer_4480b9e0068a8adb:function(e){let t;try{t=e instanceof ArrayBuffer}catch{t=!1}return t},__wbg_instanceof_Map_e5b5e3db98422fcc:function(e){let t;try{t=e instanceof Map}catch{t=!1}return t},__wbg_instanceof_Uint8Array_309b927aaf7a3fc7:function(e){let t;try{t=e instanceof Uint8Array}catch{t=!1}return t},__wbg_isArray_0677c962b281d01a:function(e){return Array.isArray(e)},__wbg_isSafeInteger_04f36e4056f1b851:function(e){return Number.isSafeInteger(e)},__wbg_iterator_6f722e4a93058b71:function(){return Symbol.iterator},__wbg_length_1f0964f4a5e2c6d8:function(e){return e.length},__wbg_length_370319915dc99107:function(e){return e.length},__wbg_new_32b398fb48b6d94a:function(){return[]},__wbg_new_cd45aabdf6073e84:function(e){return new Uint8Array(e)},__wbg_new_da52cf8fe3429cb2:function(){return{}},__wbg_next_6dbf2c0ac8cde20f:function(e){return e.next},__wbg_next_71f2aa1cb3d1e37e:function(){return d(function(e){return e.next()},arguments)},__wbg_prototypesetcall_4770620bbe4688a0:function(e,t,n){Uint8Array.prototype.set.call(a(e,t),n)},__wbg_set_6be42768c690e380:function(e,t,n){e[t]=n},__wbg_set_8a16b38e4805b298:function(e,t,n){e[t>>>0]=n},__wbg_value_a5d5488a9589444a:function(e){return e.value},__wbindgen_cast_0000000000000001:function(e){return e},__wbindgen_cast_0000000000000002:function(e){return e},__wbindgen_cast_0000000000000003:function(e,t){return c(e,t)},__wbindgen_cast_0000000000000004:function(e){return BigInt.asUintN(64,e)},__wbindgen_init_externref_table:function(){let e=b.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}}}}var n=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>b.__wbg_wmlengine_free(e,1));function r(e){let t=b.__externref_table_alloc();return b.__wbindgen_externrefs.set(t,e),t}function i(e){let t=typeof e;if(t==`number`||t==`boolean`||e==null)return`${e}`;if(t==`string`)return`"${e}"`;if(t==`symbol`){let t=e.description;return t==null?`Symbol`:`Symbol(${t})`}if(t==`function`){let t=e.name;return typeof t==`string`&&t.length>0?`Function(${t})`:`Function`}if(Array.isArray(e)){let t=e.length,n=`[`;t>0&&(n+=i(e[0]));for(let r=1;r<t;r++)n+=`, `+i(e[r]);return n+=`]`,n}let n=/\[object ([^\]]+)\]/.exec(toString.call(e)),r;if(n&&n.length>1)r=n[1];else return toString.call(e);if(r==`Object`)try{return`Object(`+JSON.stringify(e)+`)`}catch{return`Object`}return e instanceof Error?`${e.name}: ${e.message}\n${e.stack}`:r}function a(e,t){return e>>>=0,u().subarray(e/1,e/1+t)}var o=null;function s(){return(o===null||o.buffer.detached===!0||o.buffer.detached===void 0&&o.buffer!==b.memory.buffer)&&(o=new DataView(b.memory.buffer)),o}function c(e,t){return te(e>>>0,t)}var l=null;function u(){return(l===null||l.byteLength===0)&&(l=new Uint8Array(b.memory.buffer)),l}function d(e,t){try{return e.apply(this,t)}catch(e){let t=r(e);b.__wbindgen_exn_store(t)}}function f(e){return e==null}function p(e,t){let n=t(e.length*1,1)>>>0;return u().set(e,n/1),y=e.length,n}function m(e,t,n){if(n===void 0){let n=v.encode(e),r=t(n.length,1)>>>0;return u().subarray(r,r+n.length).set(n),y=n.length,r}let r=e.length,i=t(r,1)>>>0,a=u(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=u().subarray(i+o,i+r),a=v.encodeInto(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return y=o,i}function h(e){let t=b.__wbindgen_externrefs.get(e);return b.__externref_table_dealloc(e),t}var g=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0});g.decode();var ee=2146435072,_=0;function te(e,t){return _+=t,_>=ee&&(g=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}),g.decode(),_=t),g.decode(u().subarray(e,e+t))}var v=new TextEncoder;`encodeInto`in v||(v.encodeInto=function(e,t){let n=v.encode(e);return t.set(n),{read:e.length,written:n.length}});var y=0,b;function ne(e,t){return b=e.exports,o=null,l=null,b.__wbindgen_start(),b}async function re(e,t){if(typeof Response==`function`&&e instanceof Response){if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(e.ok&&n(e.type)&&e.headers.get(`Content-Type`)!==`application/wasm`)console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",t);else throw t}let r=await e.arrayBuffer();return await WebAssembly.instantiate(r,t)}else{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}function n(e){switch(e){case`basic`:case`cors`:case`default`:return!0}return!1}}async function ie(e){if(b!==void 0)return b;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`)),e===void 0&&(e=new URL(``+new URL(`wavenav_engine_bg-DDxyf_Vv.wasm`,import.meta.url).href,``+import.meta.url));let n=t();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:r,module:i}=await re(await e,n);return ne(r,i)}var x=16,S=8,C=`http://local.test/deck.wml`,ae=`text/vnd.wap.wml`;async function oe(t,n){await ie();let r=new e;r.setViewportCols(20),se(r),r.loadDeckContext(n,C,ae);function i(){let e=t.getContext(`2d`);if(!e)return;e.clearRect(0,0,t.width,t.height),e.font=`14px "IBM Plex Mono", monospace`,e.textBaseline=`top`;let n=r.render();for(let r of n.draw){let n=r.x*S,i=r.y*x;if(r.type===`text`){e.fillStyle=`#171914`,e.fillText(r.text,n,i);continue}r.type===`link`&&(r.focused&&(e.fillStyle=`#d8dcef`,e.fillRect(0,i-1,t.width,18)),e.fillStyle=r.focused?`#171914`:`#1538a1`,e.fillText(r.text,n,i))}}return i(),{loadDeck(e){r.loadDeckContext(e,C,ae),se(r),i()},pressKey(e){r.handleKey(e),i()},advanceTimeMs(e){r.advanceTimeMs(e),i()},navigateBack(){let e=r.navigateBack();return i(),e},snapshot(){let e=r;return{activeCardId:r.activeCardId(),focusedLinkIndex:r.focusedLinkIndex(),baseUrl:r.baseUrl(),contentType:r.contentType(),nextCardVar:r.getVar(`nextCard`),externalNavigationIntent:r.externalNavigationIntent(),externalNavigationRequestPolicy:e.externalNavigationRequestPolicy?.()??void 0,lastScriptExecutionOk:r.lastScriptExecutionOk(),lastScriptExecutionTrap:r.lastScriptExecutionTrap(),lastScriptExecutionErrorClass:e.lastScriptExecutionErrorClass?.()??void 0,lastScriptExecutionErrorCategory:e.lastScriptExecutionErrorCategory?.()??void 0,lastScriptRequiresRefresh:r.lastScriptRequiresRefresh()}},clearExternalNavigationIntent(){r.clearExternalNavigationIntent()},getVar(e){return r.getVar(e)},setVar(e,t){return r.setVar(e,t)},executeScriptUnit(e){return r.executeScriptUnit(e)},registerScriptUnit(e,t){r.registerScriptUnit(e,t)},clearScriptUnits(){r.clearScriptUnits()},registerScriptEntryPoint(e,t,n){r.registerScriptEntryPoint(e,t,n)},clearScriptEntryPoints(){r.clearScriptEntryPoints()},invokeScriptRef(e){let t=r.invokeScriptRef(e);return(t.effects.requiresRefresh||t.effects.navigationIntent.type!==`none`)&&i(),t},invokeScriptRefFunction(e,t){let n=r.invokeScriptRefFunction(e,t);return(n.effects.requiresRefresh||n.effects.navigationIntent.type!==`none`)&&i(),n},invokeScriptRefCall(e,t,n){let a=r.invokeScriptRefCall(e,t,n);return(a.effects.requiresRefresh||a.effects.navigationIntent.type!==`none`)&&i(),a},executeScriptRef(e){return r.executeScriptRef(e)},executeScriptRefFunction(e,t){return r.executeScriptRefFunction(e,t)},executeScriptRefCall(e,t,n){return r.executeScriptRefCall(e,t,n)},lastScriptExecutionTrap(){return r.lastScriptExecutionTrap()},lastScriptExecutionOk(){return r.lastScriptExecutionOk()},lastScriptExecutionErrorClass(){return r.lastScriptExecutionErrorClass?.()},lastScriptExecutionErrorCategory(){return r.lastScriptExecutionErrorCategory?.()},lastScriptRequiresRefresh(){return r.lastScriptRequiresRefresh()},traceEntries(){return r.traceEntries()},clearTraceEntries(){r.clearTraceEntries()},render:i,getEngine(){return r}}}function se(e){e.clearScriptUnits(),e.clearScriptEntryPoints(),e.registerScriptUnit(`calc.wmlsc`,new Uint8Array([1,4,1,5,2,0])),e.registerScriptEntryPoint(`calc.wmlsc`,`main`,0),e.registerScriptUnit(`wmlbrowser-demo.wmlsc`,new Uint8Array([3,8,110,101,120,116,67,97,114,100,3,5,35,110,101,120,116,32,2,2,3,5,35,110,101,120,116,32,3,1,0,32,4,0,0,3,8,110,101,120,116,67,97,114,100,32,1,1,0,3,8,110,101,120,116,67,97,114,100,32,11,0,32,2,2,0,3,8,110,101,120,116,67,97,114,100,3,11,98,101,102,111,114,101,82,101,115,101,116,32,2,2,32,10,0,32,4,0,0])),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`main`,0),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`back`,31),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`readNext`,35),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`readCurrentCard`,49),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`newContextPrev`,66),e.registerScriptUnit(`wavescript-fixtures.wmlsc`,new Uint8Array([3,8,110,101,120,116,67,97,114,100,3,7,117,112,100,97,116,101,100,32,2,2,0,3,5,35,110,101,120,116,32,3,1,3,0,32,3,1,0,3,20,110,101,120,116,46,119,109,108,63,102,114,111,109,61,115,99,114,105,112,116,32,3,1,0,3,5,35,110,101,120,116,32,3,1,32,4,0,0,32,4,0,3,5,35,110,101,120,116,32,3,1,0])),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`refreshOnly`,0),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`goCancel`,23),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`externalGo`,39),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`goThenPrev`,63),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`prevThenGo`,77)}var w=[{key:`acceptErrorRollback`,label:`Accept Error Rollback`,description:`Demonstrates deterministic rollback when accept-task navigation targets are invalid.`,goal:`Verify failed accept go action does not partially mutate runtime state.`,workItems:[`R0-02`],specItems:[`WML-18`,`WML-R-017`],testingAc:[`Enter "To broken accept" then Enter again.`,`Confirm action fails and activeCardId remains accept-broken.`,`Press Back and confirm activeCardId returns to home.`],wml:`<wml>
  <card id="home">
    <p>Rollback demo.</p>
    <a href="#accept-broken">To broken accept</a>
  </card>

  <card id="accept-broken">
    <do type="accept"><go href="#missing"/></do>
    <p>Accept action should fail and keep this card active.</p>
  </card>
</wml>
`},{key:`acceptNoopOrdering`,label:`Accept Noop Ordering`,description:`Exercises accept-task ordering with explicit noop behavior alongside go/prev/refresh flows.`,goal:`Verify noop is deterministic and does not mutate navigation/history while other accept actions retain expected behavior.`,workItems:[`R0-02`],specItems:[`WML-18`,`WML-R-012`,`WML-R-015`,`WML-R-017`],testingAc:[`Enter "Accept go" then Enter again; activeCardId should become target.`,`Return home, enter "Accept prev" then Enter again; activeCardId should become home.`,`Enter "Accept refresh" then Enter; activeCardId should stay accept-refresh.`,`Enter "Accept noop" then Enter; activeCardId should stay accept-noop and history depth should not change.`],wml:`<wml>
  <card id="home">
    <a href="#accept-go">Accept go</a>
    <a href="#accept-prev">Accept prev</a>
    <a href="#accept-refresh">Accept refresh</a>
    <a href="#accept-noop">Accept noop</a>
  </card>

  <card id="accept-go">
    <do type="accept"><go href="#target"/></do>
    <p>Enter should run accept go.</p>
  </card>

  <card id="accept-prev">
    <do type="accept"><prev/></do>
    <p>Enter should run accept prev.</p>
  </card>

  <card id="accept-refresh">
    <do type="accept"><refresh/></do>
    <p>Enter should run accept refresh.</p>
  </card>

  <card id="accept-noop">
    <do type="accept"><noop/></do>
    <p>Enter should run accept noop without state mutation.</p>
  </card>

  <card id="target">
    <p>Reached via accept go.</p>
  </card>
</wml>
`},{key:`actionsDoOnevent`,label:`Do + Onevent Actions`,description:`Demonstrates accept softkey action and onenterforward event chaining through runtime action handling.`,goal:`Verify runtime executes card-level action/event href intents without host-side semantics.`,workItems:[`W0-01`],specItems:[`RQ-WMLS-018`],testingAc:[`Load the example and press Enter on the first card; activeCardId should move from home to trigger.`,`Confirm onenterforward on trigger executes immediately and activeCardId becomes final.`,`Confirm externalNavigationIntent remains (none) through the flow.`],wml:`<wml>
  <card id="home">
    <do type="accept">
      <go href="#trigger"/>
    </do>
    <p>Press Enter to run the accept action.</p>
  </card>
  <card id="trigger">
    <onevent type="onenterforward">
      <go href="#final"/>
    </onevent>
    <p>This card should auto-forward to final.</p>
  </card>
  <card id="final">
    <p>Final card reached via onenterforward.</p>
    <a href="#home">Back home</a>
  </card>
</wml>
`},{key:`actionsPrevTaskModel`,label:`Prev Task Model`,description:"Demonstrates deterministic `<prev/>` handling for accept and intrinsic card-entry events.",goal:"Verify task-model `prev` actions are executed consistently in runtime-owned action/event plumbing.",workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`],testingAc:[`Press Enter on "To middle" and then Enter again; activeCardId should return to home (accept prev).`,`From home, Enter "To middle", then Enter "To next".`,`Press Back once; activeCardId should become home because middle runs onenterbackward prev.`],wml:`<wml>
  <card id="home">
    <p>Prev task demo.</p>
    <a href="#mid-accept">To middle (accept prev)</a>
    <a href="#mid-back">To middle (onenterbackward prev)</a>
  </card>

  <card id="mid-accept">
    <do type="accept"><prev/></do>
    <p>No links on this card; Enter should invoke accept prev.</p>
  </card>

  <card id="mid-back">
    <onevent type="onenterbackward"><prev/></onevent>
    <a href="#next">To next</a>
  </card>

  <card id="next">
    <p>Use host Back to trigger onenterbackward prev in mid-back.</p>
  </card>
</wml>
`},{key:`actionsRefreshRollback`,label:`Refresh + Rollback`,description:"Demonstrates task-model `<refresh/>` execution and rollback behavior when entry-task actions fail.",goal:`Verify refresh does not mutate navigation state and failed onenterforward actions leave invoking card current.`,workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`,`WML-R-017`],testingAc:[`Press Enter on "To refresh card", then Enter again; activeCardId should stay refresh-card.`,`Press Back; activeCardId should return to home.`,`Press Down then Enter on "Broken forward entry"; load should fail and activeCardId should remain home.`],wml:`<wml>
  <card id="home">
    <p>Refresh + rollback demo.</p>
    <a href="#refresh-card">To refresh card</a>
    <a href="#broken-forward">Broken forward entry</a>
  </card>

  <card id="refresh-card">
    <do type="accept"><refresh/></do>
    <p>Enter invokes refresh and stays on this card.</p>
  </card>

  <card id="broken-forward">
    <onevent type="onenterforward"><go href="#missing"/></onevent>
    <p>This card should never become active because entry action fails.</p>
  </card>
</wml>
`},{key:`actionsTaskOrderRollback`,label:`Task Order + Rollback`,description:`Exercises accept-task ordering for go/prev/refresh and failure rollback when task navigation targets are invalid.`,goal:`Validate deterministic action trace ordering and no partial state mutation on failed task actions.`,workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`,`WML-R-017`],testingAc:[`Enter "Accept go" then Enter again; activeCardId should become target.`,`Back to home, enter "Accept prev" then Enter again; activeCardId should become home.`,`Enter "Accept refresh" then Enter; activeCardId should stay accept-refresh.`,`Enter "Accept broken" then Enter; action should error and activeCardId should remain accept-broken.`],wml:`<wml>
  <card id="home">
    <a href="#accept-go">Accept go</a>
    <a href="#accept-prev">Accept prev</a>
    <a href="#accept-refresh">Accept refresh</a>
    <a href="#accept-broken">Accept broken</a>
  </card>

  <card id="accept-go">
    <do type="accept"><go href="#target"/></do>
    <p>Enter should run accept go.</p>
  </card>

  <card id="accept-prev">
    <do type="accept"><prev/></do>
    <p>Enter should run accept prev.</p>
  </card>

  <card id="accept-refresh">
    <do type="accept"><refresh/></do>
    <p>Enter should run accept refresh.</p>
  </card>

  <card id="accept-broken">
    <do type="accept"><go href="#missing"/></do>
    <p>Enter should fail and keep this card active.</p>
  </card>

  <card id="target">
    <p>Reached via accept go.</p>
  </card>
</wml>
`},{key:`basic`,label:`Basic Navigation`,description:`Baseline navigation deck with one fragment link and one external link.`,goal:`Verify fragment transitions mutate active card while external links only emit host intent.`,workItems:[`A2-01`,`A2-02`],specItems:[`WML-R-006`,`WML-R-007`],testingAc:[`Load the example and press Enter on "Go to next card"; activeCardId should become next.`,`Press Enter on "Return home"; activeCardId should become home.`,`Move focus to "External link" and press Enter; activeCardId should remain home.`,`Confirm runtime-state shows externalNavigationIntent as http://example.com/other.wml.`],wml:`<wml>
  <card id="home">
    <p>WaveNav Host Harness</p>
    <p>Use ArrowUp / ArrowDown / Enter.</p>
    <a href="#next">Go to next card</a>
    <br/>
    <a href="http://example.com/other.wml">External link (emits host intent)</a>
  </card>
  <card id="next">
    <p>Second card loaded.</p>
    <a href="#home">Return home</a>
  </card>
</wml>
`},{key:`cardEntryForwardBackward`,label:`Card Entry Forward+Backward`,description:`Demonstrates deterministic re-entry behavior when a card defines both onenterforward and onenterbackward handlers.`,goal:`Confirm forward entry and backward re-entry actions trigger at the expected navigation boundaries.`,workItems:[`A2-03`],specItems:[`WML-R-008`],testingAc:[`Press Enter on "Enter transit"; activeCardId should become next because transit runs onenterforward.`,`Press Back once; activeCardId should become rewind because transit runs onenterbackward on re-entry.`,`Confirm runtime trace shows ACTION_BACK and subsequent ACTION_FRAGMENT for rewind.`],wml:`<wml>
  <card id="home">
    <p>Start card.</p>
    <a href="#transit">Enter transit</a>
  </card>
  <card id="transit">
    <onevent type="onenterforward">
      <go href="#next"/>
    </onevent>
    <onevent type="onenterbackward">
      <go href="#rewind"/>
    </onevent>
    <p>Transit card should not remain active after either entry event.</p>
  </card>
  <card id="next">
    <p>Reached from onenterforward.</p>
  </card>
  <card id="rewind">
    <p>Reached from onenterbackward.</p>
    <a href="#home">Return home</a>
  </card>
</wml>
`},{key:`externalNavigationIntent`,label:`External Navigation Intent`,description:`Focused demo of external intent emission for relative and absolute links.`,goal:`Validate URL intent resolution and confirm fragment behavior remains separate.`,workItems:[`A2-02`],specItems:[`WML-R-007`],testingAc:[`Press Enter on "Relative external link" and confirm activeCardId stays home.`,`Confirm externalNavigationIntent resolves to the base directory plus next.wml?from=home.`,`Press Down then Enter on "Absolute external link" and confirm intent is exactly https://example.org/absolute.`,`Press Down then Enter on "Internal fragment link" and confirm activeCardId becomes details.`],wml:`<wml>
  <card id="home">
    <p>External intent demo</p>
    <p>Enter on first link emits host intent only.</p>
    <a href="next.wml?from=home">Relative external link</a>
    <br/>
    <a href="https://example.org/absolute">Absolute external link</a>
    <br/>
    <a href="#details">Internal fragment link</a>
  </card>
  <card id="details">
    <p>Fragment navigation still changes active card.</p>
    <a href="#home">Back home</a>
  </card>
</wml>
`},{key:`fieldOpenwave2011Navigation`,label:`Field Example (Openwave 2011)`,description:`Real-world style multi-card sample used to exercise parser ordering and fragment navigation.`,goal:`Ensure source ordering, inline link parsing, and card transitions stay deterministic on legacy-like content.`,workItems:[`A1-03`,`A2-01`],specItems:[`WML-R-002`,`WML-R-006`],testingAc:[`Load the deck and verify activeCardId starts at main.`,`Press Enter on "Here" and confirm activeCardId transitions to content.`,`Use Down and Enter on one of the external service links and verify activeCardId remains content.`,`Confirm runtime-state externalNavigationIntent updates when entering an external service link.`],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//OPENWAVE.COM//DTD WML 1.3//EN"
"http://www.openwave.com/dtd/wml13.dtd">
<wml>
  <card id="main" title="Wireless Programming">
    <p align="center" mode="wrap">
      Welcome to our <em>Online Mobile Course</em><br/>
      <big><strong>Wireless Programming</strong></big>
    </p>
    <p>To Continue Click <a href="#content">Here</a></p>
  </card>
  <card id="content" title="Services">
    <p>
      List of our services<br/>
      <a href="dictionary.wml">WAP Dictionary</a><br/>
      <a href="Lectures.wml">WAP Lectures</a><br/>
      <a href="Quizes.wml">WAP Quizes</a><br/>
      <a href="Assignments.wml">WAP Assignments</a><br/>
      <a href="FAQ.wml">WAP FAQ</a><br/>
    </p>
  </card>
</wml>
`},{key:`formsSelectLocal`,label:`Forms Select (Local)`,description:`Local-mode form example for single-select option cycling, commit, cancel, and captured submit intent.`,goal:`Verify engine-owned select state cycles deterministically, survives commit/cancel, and feeds a local-only submit intent.`,workItems:[`A5-05`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-003`,`RQ-RMK-008`],testingAc:[`Load the example in Waves local mode and verify the default selected country is rendered.`,`Focus the Country select, press Enter, then ArrowDown to cycle through options.`,`Press Escape once and confirm the select returns to the original committed option.`,`Re-enter select edit, cycle to a new option, press Enter to commit, then submit and confirm local mode captures the external intent.`],wml:`<wml>
  <card id="profile" title="Local Select">
    <p>
      Country:
      <select name="Country" title="Country">
        <option value="Jordan">Jordan</option>
        <option value="France">France</option>
        <option value="Germany">Germany</option>
      </select>
    </p>
    <do type="accept">
      <go method="post" href="/profile">
        <postfield name="Country" value="$(Country)"/>
      </go>
    </do>
  </card>
</wml>
`},{key:`formsSelectNavigationLocal`,label:`Forms Select + Navigation (Local)`,description:`Local-mode select example with surrounding links and inputs to verify entering, exiting, and moving focus away from select edit mode.`,goal:`Verify select edit can be engaged, committed or canceled, and then cleanly disengaged so focus navigation resumes across other page items.`,workItems:[`A5-05`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-003`,`RQ-RMK-008`],testingAc:[`Load the example in Waves local mode and confirm the first focus target is the "Help" link.`,`Move focus to the Country select, press Enter to begin edit, then ArrowDown to change the draft option.`,`Press Enter to commit and confirm a subsequent ArrowDown moves focus to the PIN input instead of changing Country again.`,`Re-enter Country edit, change the draft option, then press Escape and confirm the original committed option remains visible.`,`Submit the card and confirm Waves captures the local-mode external intent without fetching.`],wml:`<wml>
  <card id="profile" title="Select Navigation">
    <p><a href="#help">Help</a></p>
    <p>
      Country:
      <select name="Country" title="Country">
        <option value="Jordan">Jordan</option>
        <option value="France">France</option>
        <option value="Germany">Germany</option>
        <option value="Japan">Japan</option>
      </select>
    </p>
    <p>PIN: <input name="pin" value="" type="password"/></p>
    <p><a href="#review">Review</a></p>
    <do type="accept">
      <go method="post" href="/profile">
        <postfield name="Country" value="$(Country)"/>
        <postfield name="pin" value="$(pin)"/>
      </go>
    </do>
  </card>
  <card id="help" title="Help">
    <p>Use Enter to begin or commit select edit.</p>
    <p>Use Escape to cancel select edit.</p>
    <p><a href="#profile">Back</a></p>
  </card>
  <card id="review" title="Review">
    <p>Review card reached through normal focus navigation.</p>
    <p><a href="#profile">Back</a></p>
  </card>
</wml>
`},{key:`formsTextSubmitLocal`,label:`Forms Text Submit (Local)`,description:`Local-mode form example for text and password input editing with captured POST intent.`,goal:`Verify engine-owned text form state commits deterministically and local mode captures submit intent without fetching.`,workItems:[`A5-04`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-008`],testingAc:[`Load the example in Waves local mode and confirm activeCardId starts at login.`,`Press Enter on the username field, type a new value, and press Enter to commit.`,`Move to the PIN field, type digits, and confirm the viewport masks the committed value.`,`Submit the card and confirm Waves reports a captured external intent instead of performing a fetch.`],wml:`<wml>
  <card id="login" title="Local Login">
    <p>User: <input name="username" value="AHMED" type="text"/></p>
    <p>PIN: <input name="pin" value="" type="password"/></p>
    <do type="accept">
      <go method="post" href="/login">
        <postfield name="username" value="$(username)"/>
        <postfield name="pin" value="$(pin)"/>
      </go>
    </do>
  </card>
</wml>
`},{key:`historyBackProcessOrder`,label:`History Back Process Order`,description:`Exercises multi-step fragment navigation and deterministic back traversal order.`,goal:`Verify back traversal replays prior card order without skipping or mutating unrelated state.`,workItems:[`R0-02`,`R0-03`],specItems:[`WML-18`,`WML-07`,`WML-R-008`],testingAc:[`Navigate home -> level-1 -> level-2 using Enter.`,`Press Back once and confirm activeCardId is level-1.`,`Press Back again and confirm activeCardId is home.`,`Press Back on home and confirm no-op behavior with activeCardId still home.`],wml:`<wml>
  <card id="home">
    <p>History process-order demo.</p>
    <a href="#level-1">To level 1</a>
  </card>

  <card id="level-1">
    <p>Level 1 card.</p>
    <a href="#level-2">To level 2</a>
  </card>

  <card id="level-2">
    <p>Level 2 card.</p>
    <a href="#home">Return home via link</a>
  </card>
</wml>
`},{key:`historyBackStack`,label:`History Back Stack`,description:`Exercises fragment navigation history and host-triggered back navigation.`,goal:`Verify runtime pushes history on fragment transitions and pops deterministically through navigateBack.`,workItems:[`A2-03`],specItems:[`WML-R-008`],testingAc:[`Load the deck and press Enter on "Go to next"; activeCardId should become next.`,`Press Back; activeCardId should return to home.`,`Press Back again and confirm status reports history empty with activeCardId still home.`],wml:`<wml>
  <card id="home">
    <p>History baseline demo.</p>
    <a href="#next">Go to next</a>
  </card>
  <card id="next">
    <p>Second card reached by fragment navigation.</p>
    <a href="#home">Return home via link</a>
  </card>
</wml>
`},{key:`missingFragment`,label:`Missing Fragment Error`,description:`Negative navigation case where a fragment target is absent.`,goal:`Verify missing fragment transitions fail deterministically without mutating runtime state.`,workItems:[`A2-01`],specItems:[`WML-R-006`],testingAc:[`Load the deck and confirm activeCardId is home.`,`Press Enter on "Broken target".`,`Confirm status shows a key error and activeCardId remains home.`,`Confirm focusedLinkIndex remains stable after the failed navigation.`],wml:`<wml>
  <card id="home">
    <p>Missing fragment test</p>
    <a href="#missing">Broken target</a>
  </card>
</wml>
`},{key:`onenterbackwardReentry`,label:`OnEnterBackward Reentry`,description:`Demonstrates card re-entry behavior when navigateBack lands on a card with onenterbackward.`,goal:`Verify backward navigation triggers onenterbackward deterministically before the user resumes input.`,workItems:[`A2-03`],specItems:[`WML-R-008`],testingAc:[`Press Enter on "To middle", then Enter on "To next"; activeCardId should become next.`,`Press Back once; activeCardId should become rewind (not middle) because mid defines onenterbackward.`,`Confirm runtime trace includes ACTION_BACK followed by ACTION_FRAGMENT for rewind.`],wml:`<wml>
  <card id="home">
    <p>Start card.</p>
    <a href="#mid">To middle</a>
  </card>
  <card id="mid">
    <onevent type="onenterbackward">
      <go href="#rewind"/>
    </onevent>
    <p>Middle card runs backward-entry action.</p>
    <a href="#next">To next</a>
  </card>
  <card id="next">
    <p>Reached from middle.</p>
  </card>
  <card id="rewind">
    <p>Reached via onenterbackward.</p>
    <a href="#home">Return home</a>
  </card>
</wml>
`},{key:`parserRobustness`,label:`Parser Robustness`,description:`Includes unsupported tags and valid card content to assert parser resilience.`,goal:`Confirm unsupported tags are ignored while valid nodes remain functional and navigable.`,workItems:[`A1-01`,`A1-03`],specItems:[`WML-R-001`,`WML-R-020`],testingAc:[`Load the deck and verify it renders without load errors.`,`Confirm activeCardId starts at home despite the unsupported <cardinal> node.`,`Press Enter on "Next" and confirm transition to next works.`,`Press Enter on "Back" and confirm transition to home works.`],wml:`<wml>
  <cardinal id="noise">Ignore me</cardinal>
  <card id="home">
    <p>Hello <a href="#next">Next</a></p>
  </card>
  <card id="next">
    <p>Still works.</p>
    <a href="#home">Back</a>
  </card>
</wml>
`},{key:`scriptLinkExecution`,label:`Script Link Execution`,description:`Runs a registered script unit through a script href and exposes execution outcome in runtime state.`,goal:`Validate runtime routes script href actions into engine VM execution path.`,workItems:[`W0-01`,`W0-03`],specItems:[`RQ-WMLS-001`,`RQ-WMLS-008`],testingAc:[`Load the example and press Enter on "Run calc script"; activeCardId should stay home.`,`Confirm runtime-state lastScriptExecutionOk becomes true.`,`Confirm runtime-state lastScriptExecutionTrap remains (none).`],wml:`<wml>
  <card id="home">
    <p>Script action execution demo.</p>
    <a href="script:calc.wmlsc#main">Run calc script</a>
    <br/>
    <a href="#done">Continue</a>
  </card>
  <card id="done">
    <p>Script executed in previous card.</p>
    <a href="#home">Back</a>
  </card>
</wml>
`},{key:`timerHostClockLifecycle`,label:`Timer Host Clock Lifecycle`,description:"Demonstrates host-driven deterministic timer ticking for non-zero `<timer value>` expiry.",goal:`Verify auto tick advances runtime clock and ontimer dispatch transitions cards without manual key input.`,workItems:[`A5-03`],specItems:[`WML-R-014`],testingAc:[`Select this example and press Enter on "Start timed card".`,`Enable Auto Tick with 100ms step and wait until the card transitions.`,`Confirm activeCardId transitions from timed to done and trace contains TIMER_TICK, TIMER_EXPIRE, and ACTION_ONTIMER.`],wml:`<wml>
  <card id="home">
    <a href="#timed">Start timed card</a>
  </card>
  <card id="timed">
    <timer value="15"/>
    <onevent type="ontimer"><go href="#done"/></onevent>
    <p>Auto tick should move this card after 1.5 seconds.</p>
  </card>
  <card id="done">
    <p>Timer completed through host clock lifecycle.</p>
  </card>
</wml>
`},{key:`timerOntimerImmediate`,label:`Timer Ontimer Immediate`,description:'Demonstrates immediate ontimer dispatch for `<timer value="0"/>` at card-entry boundaries.',goal:`Verify runtime-owned timer dispatch executes ontimer action deterministically on entry.`,workItems:[`A5-03`],specItems:[`WML-R-014`],testingAc:[`Press Enter on "To timed" from home.`,`Confirm activeCardId becomes next immediately (timed card should not remain active).`,`Confirm trace includes TIMER_START and ACTION_ONTIMER before the final ACTION_FRAGMENT to next.`],wml:`<wml>
  <card id="home">
    <a href="#timed">To timed</a>
  </card>
  <card id="timed">
    <timer value="0"/>
    <onevent type="ontimer"><go href="#next"/></onevent>
    <p>Timed card should auto-advance.</p>
  </card>
  <card id="next">
    <p>Reached via ontimer dispatch.</p>
  </card>
</wml>
`},{key:`wavescriptGoCancel`,label:`WaveScript Go Cancel`,description:`Exercises go-cancel behavior where go("") clears pending navigation intent in the same invocation.`,goal:`Verify deferred navigation cancellation semantics are deterministic.`,workItems:[`W0-04`],specItems:[`RQ-WMLS-018`],testingAc:[`On home card, press Enter on "Script go then cancel".`,`Confirm activeCardId remains home after invocation.`,`Confirm runtime-state externalNavigationIntent remains (none).`],wml:`<wml>
  <card id="home">
    <p>go("#next") then go("") in one script invocation.</p>
    <a href="script:wavescript-fixtures.wmlsc#goCancel">Script go then cancel</a>
  </card>
  <card id="next">
    <p>If you can read this from the script link, cancellation regressed.</p>
    <a href="#home">Back</a>
  </card>
</wml>
`},{key:`wavescriptNavOrder`,label:`WaveScript Navigation Order`,description:`Demonstrates last-call-wins behavior for go/prev ordering inside a single script invocation.`,goal:`Confirm ordering rules stay deterministic as compatibility fixtures evolve.`,workItems:[`W0-04`],specItems:[`RQ-WMLS-018`],testingAc:[`Press Enter on "go then prev" and confirm activeCardId stays home.`,`Press Down then Enter on "prev then go" and confirm activeCardId becomes next.`,`On next card, press Enter on "Script external go" and confirm externalNavigationIntent is populated.`],wml:`<wml>
  <card id="home">
    <p>Navigation ordering matrix.</p>
    <a href="script:wavescript-fixtures.wmlsc#goThenPrev">go then prev</a>
    <br/>
    <a href="script:wavescript-fixtures.wmlsc#prevThenGo">prev then go</a>
  </card>
  <card id="next">
    <p>Reached via prev-then-go ordering.</p>
    <a href="script:wavescript-fixtures.wmlsc#externalGo">Script external go</a>
    <br/>
    <a href="#home">Back home</a>
  </card>
</wml>
`},{key:`wavescriptRefreshPolicy`,label:`WaveScript Refresh Policy`,description:`Verifies setVar-driven refresh signaling without navigation side effects.`,goal:`Confirm requiresRefresh policy is surfaced while active card remains stable.`,workItems:[`W0-04`],specItems:[`RQ-WMLS-017`,`RQ-WMLS-021`],testingAc:[`On home card, press Enter on "Script setVar only".`,`Confirm activeCardId remains home and focusedLinkIndex remains stable.`,`Confirm runtime-state nextCardVar becomes updated and lastScriptRequiresRefresh becomes true.`],wml:`<wml>
  <card id="home">
    <p>Refresh policy demo (no navigation).</p>
    <a href="script:wavescript-fixtures.wmlsc#refreshOnly">Script setVar only</a>
  </card>
</wml>
`},{key:`wmlbrowserContextFidelity`,label:`WMLBrowser Context Fidelity`,description:`Exercises getCurrentCard and newContext semantics, including context reset side effects and prev suppression.`,goal:`Validate that current-card lookup and newContext resets align with WMLScript context semantics in host-visible flows.`,workItems:[`R0-03`,`W0-07`],specItems:[`RQ-WMLS-019`,`RQ-WMLS-020`],testingAc:[`On home card, press Enter on "Read current card into nextCard" and confirm runtime-state nextCardVar becomes #home.`,`Follow "Go to next card" then activate "Run newContext + prev"; activeCardId should remain next and nextCardVar should clear.`,`Press browser Back after newContext and verify history is cleared for prior card context (no return to home via engine history).`],wml:`<wml>
  <card id="home">
    <p>WMLBrowser context semantics demo.</p>
    <a href="script:wmlbrowser-demo.wmlsc#readCurrentCard">Read current card into nextCard</a>
    <a href="#next">Go to next card</a>
  </card>
  <card id="next">
    <p>newContext should clear vars/history and ignore prev in same script.</p>
    <a href="script:wmlbrowser-demo.wmlsc#newContextPrev">Run newContext + prev</a>
    <a href="script:wmlbrowser-demo.wmlsc#readCurrentCard">Read current card into nextCard</a>
  </card>
</wml>
`},{key:`wmlbrowserVarNav`,label:`WMLBrowser Var + Nav`,description:`Exercises script-host bindings for setVar/getVar and deferred go/prev navigation effects.`,goal:`Validate WMLBrowser subset semantics at the engine-owned post-invocation boundary.`,workItems:[`W0-04`],specItems:[`RQ-WMLS-017`,`RQ-WMLS-018`],testingAc:[`On home card, press Enter on "Script setVar + go"; activeCardId should become next.`,`Confirm runtime-state nextCardVar becomes #next after the script runs.`,`On next card, press Enter on "Script prev"; activeCardId should return to home.`],wml:`<wml>
  <card id="home">
    <p>WMLBrowser var/nav subset demo.</p>
    <a href="script:wmlbrowser-demo.wmlsc#main">Script setVar + go</a>
  </card>
  <card id="next">
    <p>Navigation came from script go().</p>
    <a href="script:wmlbrowser-demo.wmlsc#back">Script prev</a>
  </card>
</wml>
`},{key:`wrapStress`,label:`Long Token Wrap`,description:`Long unbroken token fixture for deterministic wrapping checks.`,goal:`Detect layout regressions in char-width wrapping and ensure navigation remains usable.`,workItems:[`A3-01`],specItems:[`WML-R-004`],testingAc:[`Load the deck and confirm the long token wraps consistently in the canvas viewport.`,`Reload the same deck multiple times and verify visual wrapping does not drift.`,`Press Enter on "Continue" and confirm activeCardId transitions to next.`,`Press Enter on "Back" and confirm return to home.`],wml:`<wml>
  <card id="home">
    <p>supercalifragilisticpseudopneumonoultramicroscopicsilicovolcanoconiosis</p>
    <a href="#next">Continue</a>
  </card>
  <card id="next">
    <p>Wrap test complete.</p>
    <a href="#home">Back</a>
  </card>
</wml>
`}];function ce(e){return e===`ArrowUp`?`up`:e===`ArrowDown`?`down`:e===`Enter`?`enter`:null}function le(e){let t=!1,n=()=>{e.container.classList.toggle(e.collapsedClass,t),e.toggleButton.textContent=t?`Expand`:`Collapse`,e.toggleButton.setAttribute(`aria-expanded`,String(!t))};return{apply:n,toggle:()=>{t=!t,n()}}}function ue(e,t){e.textContent=[`activeCardId: ${t.activeCardId}`,`focusedLinkIndex: ${t.focusedLinkIndex}`,`baseUrl: ${t.baseUrl}`,`contentType: ${t.contentType}`,`nextCardVar: ${t.nextCardVar??`(none)`}`,`externalNavigationIntent: ${t.externalNavigationIntent??`(none)`}`,`lastScriptExecutionOk: ${t.lastScriptExecutionOk??`(none)`}`,`lastScriptExecutionTrap: ${t.lastScriptExecutionTrap??`(none)`}`,`lastScriptExecutionErrorClass: ${t.lastScriptExecutionErrorClass??`(none)`}`,`lastScriptExecutionErrorCategory: ${t.lastScriptExecutionErrorCategory??`(none)`}`,`lastScriptRequiresRefresh: ${t.lastScriptRequiresRefresh??`(none)`}`].join(`
`)}var de=class{logs=new Map;sequence=1;activeExampleKey;output;constructor(e,t){this.output=e,this.activeExampleKey=t}setActiveExample(e){this.activeExampleKey=e,this.renderActive()}append(e,t){let n=new Date().toLocaleTimeString(`en-CA`,{hour12:!1}),r=t?`activeCardId=${t.activeCardId} focus=${t.focusedLinkIndex} intent=${t.externalNavigationIntent??`(none)`}`:``,i=`${String(this.sequence).padStart(4,`0`)} ${n} | ${e}${r?` | ${r}`:``}`;this.sequence+=1;let a=this.logs.get(this.activeExampleKey)??[];a.push(i),this.logs.set(this.activeExampleKey,a),this.output.textContent=a.join(`
`)}clearActive(){this.logs.set(this.activeExampleKey,[]),this.renderActive()}renderActive(){let e=this.logs.get(this.activeExampleKey)??[];this.output.textContent=e.length>0?e.join(`
`):`No events yet for this example.`}exportActive(e){let t=this.logs.get(this.activeExampleKey)??[];if(t.length===0)return null;let n=new Date().toISOString();return e===`json`?{filename:`wavenav-event-log-${this.activeExampleKey}.json`,mimeType:`application/json;charset=utf-8`,payload:JSON.stringify({exampleKey:this.activeExampleKey,exportedAt:n,events:t},null,2)}:{filename:`wavenav-event-log-${this.activeExampleKey}.txt`,mimeType:`text/plain;charset=utf-8`,payload:[`exampleKey: ${this.activeExampleKey}`,`exportedAt: ${n}`,``,...t].join(`
`)}}};function fe(e,t){let n=[...t.workItems,...t.specItems];e.title.textContent=`${t.label} (${t.key})`,e.coverage.textContent=`Coverage: ${n.join(`, `)}`,e.description.textContent=`Description: ${t.description}`,e.goal.textContent=`Goal: ${t.goal}`,e.testingAc.replaceChildren();for(let n of t.testingAc){let t=document.createElement(`li`);t.textContent=n,e.testingAc.appendChild(t)}}function pe(e){let t=new Blob([e.payload],{type:e.mimeType}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=e.filename,document.body.appendChild(r),r.click(),r.remove(),URL.revokeObjectURL(n)}var T=globalThis,E=T.ShadowRoot&&(T.ShadyCSS===void 0||T.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,D=Symbol(),me=new WeakMap,he=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==D)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(E&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=me.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&me.set(t,e))}return e}toString(){return this.cssText}},ge=e=>new he(typeof e==`string`?e:e+``,void 0,D),_e=(e,...t)=>new he(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,D),O=(e,t)=>{if(E)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=T.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},k=E?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return ge(t)})(e):e,{is:A,defineProperty:ve,getOwnPropertyDescriptor:ye,getOwnPropertyNames:be,getOwnPropertySymbols:xe,getPrototypeOf:Se}=Object,j=globalThis,M=j.trustedTypes,N=M?M.emptyScript:``,Ce=j.reactiveElementPolyfillSupport,P=(e,t)=>e,F={toAttribute(e,t){switch(t){case Boolean:e=e?N:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},I=(e,t)=>!A(e,t),L={attribute:!0,type:String,converter:F,reflect:!1,useDefault:!1,hasChanged:I};Symbol.metadata??=Symbol(`metadata`),j.litPropertyMetadata??=new WeakMap;var R=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=L){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&ve(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=ye(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??L}static _$Ei(){if(this.hasOwnProperty(P(`elementProperties`)))return;let e=Se(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(P(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(P(`properties`))){let e=this.properties,t=[...be(e),...xe(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(k(e))}else e!==void 0&&t.push(k(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return O(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?F:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?F:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??I)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};R.elementStyles=[],R.shadowRootOptions={mode:`open`},R[P(`elementProperties`)]=new Map,R[P(`finalized`)]=new Map,Ce?.({ReactiveElement:R}),(j.reactiveElementVersions??=[]).push(`2.1.2`);var z=globalThis,B=e=>e,V=z.trustedTypes,we=V?V.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,Te=`$lit$`,H=`lit$${Math.random().toFixed(9).slice(2)}$`,Ee=`?`+H,De=`<${Ee}>`,U=document,W=()=>U.createComment(``),G=e=>e===null||typeof e!=`object`&&typeof e!=`function`,Oe=Array.isArray,ke=e=>Oe(e)||typeof e?.[Symbol.iterator]==`function`,Ae=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,je=/-->/g,Me=/>/g,q=RegExp(`>|${Ae}(?:([^\\s"'>=/]+)(${Ae}*=${Ae}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),Ne=/'/g,Pe=/"/g,Fe=/^(?:script|style|textarea|title)$/i,Ie=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),J=Symbol.for(`lit-noChange`),Y=Symbol.for(`lit-nothing`),Le=new WeakMap,X=U.createTreeWalker(U,129);function Re(e,t){if(!Oe(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return we===void 0?t:we.createHTML(t)}var ze=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=K;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===K?c[1]===`!--`?o=je:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=q):(Fe.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=q):o=Me:o===q?c[0]===`>`?(o=i??K,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?q:c[3]===`"`?Pe:Ne):o===Pe||o===Ne?o=q:o===je||o===Me?o=K:(o=q,i=void 0);let d=o===q&&e[t+1].startsWith(`/>`)?` `:``;a+=o===K?n+De:l>=0?(r.push(s),n.slice(0,l)+Te+n.slice(l)+H+d):n+H+(l===-2?t:d)}return[Re(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},Be=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=ze(t,n);if(this.el=e.createElement(l,r),X.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=X.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(Te)){let t=u[o++],n=i.getAttribute(e).split(H),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Ue:r[1]===`?`?We:r[1]===`@`?Ge:Q}),i.removeAttribute(e)}else e.startsWith(H)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(Fe.test(i.tagName)){let e=i.textContent.split(H),t=e.length-1;if(t>0){i.textContent=V?V.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],W()),X.nextNode(),c.push({type:2,index:++a});i.append(e[t],W())}}}else if(i.nodeType===8)if(i.data===Ee)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(H,e+1))!==-1;)c.push({type:7,index:a}),e+=H.length-1}a++}}static createElement(e,t){let n=U.createElement(`template`);return n.innerHTML=e,n}};function Z(e,t,n=e,r){if(t===J)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=G(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=Z(e,i._$AS(e,t.values),i,r)),t}var Ve=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??U).importNode(t,!0);X.currentNode=r;let i=X.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new He(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Ke(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=X.nextNode(),a++)}return X.currentNode=U,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},He=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=Y,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),G(e)?e===Y||e==null||e===``?(this._$AH!==Y&&this._$AR(),this._$AH=Y):e!==this._$AH&&e!==J&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ke(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==Y&&G(this._$AH)?this._$AA.nextSibling.data=e:this.T(U.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=Be.createElement(Re(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Ve(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Le.get(e.strings);return t===void 0&&Le.set(e.strings,t=new Be(e)),t}k(t){Oe(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(W()),this.O(W()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=B(e).nextSibling;B(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Q=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=Y,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=Y}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=Z(this,e,t,0),a=!G(e)||e!==this._$AH&&e!==J,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=Z(this,r[n+o],t,o),s===J&&(s=this._$AH[o]),a||=!G(s)||s!==this._$AH[o],s===Y?e=Y:e!==Y&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===Y?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Ue=class extends Q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===Y?void 0:e}},We=class extends Q{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==Y)}},Ge=class extends Q{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??Y)===J)return;let n=this._$AH,r=e===Y&&n!==Y||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==Y&&(n===Y||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ke=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}},qe=z.litHtmlPolyfillSupport;qe?.(Be,He),(z.litHtmlVersions??=[]).push(`3.3.2`);var Je=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new He(t.insertBefore(W(),e),e,void 0,n??{})}return i._$AI(e),i},Ye=globalThis,$=class extends R{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Je(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return J}};$._$litElement$=!0,$.finalized=!0,Ye.litElementHydrateSupport?.({LitElement:$});var Xe=Ye.litElementPolyfillSupport;Xe?.({LitElement:$}),(Ye.litElementVersions??=[]).push(`4.2.2`);var Ze=class extends ${static properties={entries:{attribute:!1},exportFormat:{state:!0},kindFilter:{state:!0},cardFilter:{state:!0},trapsOnly:{state:!0}};static styles=_e`
    .trace-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .trace-actions button {
      font-size: 0.75rem;
      padding: 6px 10px;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }

    .trace-export-label {
      font-size: 0.78rem;
      align-self: center;
    }

    #trace-export-format {
      border: 1px solid var(--edge);
      border-radius: 4px;
      background: var(--surface);
      font-size: 0.78rem;
      padding: 6px 8px;
    }

    .trace-filters {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .trace-filters label,
    .trace-presets-label {
      font-size: 0.78rem;
    }

    .trace-filters button {
      font-size: 0.72rem;
      padding: 5px 8px;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }

    .trace-filters input[type='text'] {
      border: 1px solid var(--edge);
      border-radius: 4px;
      background: var(--surface);
      font-size: 0.78rem;
      padding: 6px 8px;
      min-width: 120px;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .trace-traps-only {
      min-width: 0;
    }

    .engine-trace {
      margin: 0;
      min-height: 120px;
      max-height: 220px;
      overflow: auto;
      border: 1px solid var(--edge);
      border-radius: 4px;
      padding: 10px;
      background: var(--surface-soft);
      font-size: 0.74rem;
      line-height: 1.45;
      font-family: 'IBM Plex Mono', Consolas, monospace;
      white-space: pre-wrap;
    }
  `;entries=[];exportFormat=`txt`;kindFilter=``;cardFilter=``;trapsOnly=!1;render(){let e=this.getFilteredEntries(),t=e.length===0?`No engine trace entries yet.`:e.map(e=>{let t=e.active_card_id??`(none)`,n=e.external_navigation_intent??`(none)`,r=typeof e.script_ok==`boolean`?String(e.script_ok):`(none)`,i=e.script_trap??`(none)`;return`${e.seq.toString().padStart(4,`0`)} ${e.kind} detail="${e.detail}" card=${t} focus=${e.focused_link_index} intent=${n} scriptOk=${r} trap=${i}`}).join(`
`);return Ie`
      <div class="trace-actions">
        <button type="button" @click=${this.onClearClicked}>Clear Engine Trace</button>
        <label class="trace-export-label" for="trace-export-format">Export as</label>
        <select
          id="trace-export-format"
          .value=${this.exportFormat}
          @change=${this.onExportFormatChanged}
        >
          <option value="txt">Text (.txt)</option>
          <option value="json">JSON (.json)</option>
        </select>
        <button type="button" @click=${this.onExportClicked}>Export Engine Trace</button>
      </div>
      <div class="trace-filters">
        <span class="trace-presets-label">Presets</span>
        <button type="button" @click=${()=>this.applyPreset(`all`)}>All</button>
        <button type="button" @click=${()=>this.applyPreset(`scripts`)}>Scripts</button>
        <button type="button" @click=${()=>this.applyPreset(`navigation`)}>Navigation</button>
        <button type="button" @click=${()=>this.applyPreset(`traps`)}>Traps</button>
        <label for="trace-filter-kind">Kind</label>
        <input
          id="trace-filter-kind"
          type="text"
          placeholder="e.g. ACTION_SCRIPT"
          .value=${this.kindFilter}
          @input=${this.onKindFilterChanged}
        />
        <label for="trace-filter-card">Card</label>
        <input
          id="trace-filter-card"
          type="text"
          placeholder="e.g. home"
          .value=${this.cardFilter}
          @input=${this.onCardFilterChanged}
        />
        <label class="checkbox-row trace-traps-only" for="trace-filter-traps">
          <input
            id="trace-filter-traps"
            type="checkbox"
            .checked=${this.trapsOnly}
            @change=${this.onTrapsOnlyChanged}
          />
          Traps only
        </label>
      </div>
      <pre class="engine-trace">${t}</pre>
    `}getFilteredEntries(){let e=this.kindFilter.trim().toLowerCase(),t=this.cardFilter.trim().toLowerCase();return this.entries.filter(n=>{if(this.trapsOnly&&!n.script_trap||e&&!n.kind.toLowerCase().includes(e))return!1;let r=n.active_card_id??``;return!(t&&!r.toLowerCase().includes(t))})}onClearClicked=()=>{this.dispatchEvent(new CustomEvent(`trace-clear-requested`))};onExportFormatChanged=e=>{let t=e.target;this.exportFormat=t.value===`json`?`json`:`txt`};onExportClicked=()=>{let e=this.getFilteredEntries(),t=this.exportFormat;if(e.length===0){this.dispatchEvent(new CustomEvent(`trace-exported`,{detail:{outcome:`empty`,format:t,count:0}}));return}let n=new Date().toISOString();pe(t===`json`?{filename:`wavenav-engine-trace.json`,mimeType:`application/json`,payload:JSON.stringify({exportedAt:n,entries:e},null,2)}:{filename:`wavenav-engine-trace.txt`,mimeType:`text/plain`,payload:[`exportedAt: ${n}`,`entryCount: ${e.length}`,``,...e.map(e=>{let t=e.active_card_id??`(none)`,n=e.external_navigation_intent??`(none)`,r=typeof e.script_ok==`boolean`?String(e.script_ok):`(none)`,i=e.script_trap??`(none)`;return`${e.seq.toString().padStart(4,`0`)} ${e.kind} detail="${e.detail}" card=${t} focus=${e.focused_link_index} intent=${n} scriptOk=${r} trap=${i}`})].join(`
`)}),this.dispatchEvent(new CustomEvent(`trace-exported`,{detail:{outcome:`exported`,format:t,count:e.length}}))};applyPreset(e){e===`all`?(this.kindFilter=``,this.cardFilter=``,this.trapsOnly=!1):e===`scripts`?(this.kindFilter=`ACTION_SCRIPT`,this.cardFilter=``,this.trapsOnly=!1):e===`navigation`?(this.kindFilter=`ACTION_`,this.cardFilter=``,this.trapsOnly=!1):(this.kindFilter=``,this.cardFilter=``,this.trapsOnly=!0),this.dispatchEvent(new CustomEvent(`trace-preset-applied`,{detail:{preset:e}}))}onKindFilterChanged=e=>{let t=e.target;this.kindFilter=t.value};onCardFilterChanged=e=>{let t=e.target;this.cardFilter=t.value};onTrapsOnlyChanged=e=>{let t=e.target;this.trapsOnly=t.checked}};customElements.define(`runtime-inspector-panel`,Ze);var Qe=250,$e=100,et=new Set([100,250,500,1e3]);async function tt(){let e=document.querySelector(`#wap-screen`),t=document.querySelector(`#deck-input`),n=document.querySelector(`#reload-deck`),r=document.querySelector(`#example-select`),i=document.querySelector(`.editor-wrap`),a=document.querySelector(`#toggle-editor`),o=document.querySelector(`#live-reload`),s=document.querySelector(`#press-back`),c=document.querySelector(`#press-up`),l=document.querySelector(`#press-down`),u=document.querySelector(`#press-enter`),d=document.querySelector(`#tick-100ms`),f=document.querySelector(`#tick-1s`),p=document.querySelector(`#auto-tick-step`),m=document.querySelector(`#toggle-auto-tick`),h=document.querySelector(`#clear-intent`),g=document.querySelector(`#copy-intent`),ee=document.querySelector(`#probe-execute-script`),_=document.querySelector(`#probe-invoke-script`),te=document.querySelector(`.event-log-wrap`),v=document.querySelector(`#toggle-event-log`),y=document.querySelector(`#clear-event-log`),b=document.querySelector(`#event-log-export-format`),ne=document.querySelector(`#export-event-log`),re=document.querySelector(`.trace-wrap`),ie=document.querySelector(`#toggle-trace`),x=document.querySelector(`#runtime-inspector`),S=document.querySelector(`#status`),C=document.querySelector(`#runtime-state`),ae=document.querySelector(`#event-log`),se=document.querySelector(`.example-meta`),T=document.querySelector(`#toggle-example-meta`),E=document.querySelector(`#example-title`),D=document.querySelector(`#example-coverage`),me=document.querySelector(`#example-description`),he=document.querySelector(`#example-goal`),ge=document.querySelector(`#example-testing-ac`);if(!e||!t||!n||!r||!i||!a||!o||!s||!c||!l||!u||!d||!f||!p||!m||!h||!g||!ee||!_||!te||!v||!y||!b||!ne||!re||!ie||!x||!S||!C||!ae||!se||!T||!E||!D||!me||!he||!ge)throw Error(`Host sample DOM not found`);r.replaceChildren();for(let e of w){let t=document.createElement(`option`);t.value=e.key,t.textContent=e.label,r.appendChild(t)}if(w.length===0)throw Error(`No examples available. Run: pnpm run examples:generate`);let _e=new Map(w.map(e=>[e.key,e])),O=w[0];r.value=O.key,t.value=O.wml;let k=await oe(e,t.value);S.textContent=`Loaded example: ${O.key}`;let A=O.key,ve={title:E,coverage:D,description:me,goal:he,testingAc:ge},ye=le({container:se,toggleButton:T,collapsedClass:`is-collapsed`}),be=le({container:i,toggleButton:a,collapsedClass:`is-collapsed`}),xe=le({container:te,toggleButton:v,collapsedClass:`is-collapsed`}),Se=le({container:re,toggleButton:ie,collapsedClass:`is-collapsed`}),j=new de(ae,O.key);x.addEventListener(`trace-clear-requested`,()=>{k.clearTraceEntries(),x.entries=k.traceEntries(),S.textContent=`Cleared engine trace.`,N(`TRACE_CLEARED`)}),x.addEventListener(`trace-exported`,e=>{let t=e.detail;if(t.outcome===`empty`){S.textContent=`No engine trace entries to export.`,N(`TRACE_EXPORT_SKIPPED (empty)`);return}S.textContent=`Exported ${t.count} engine trace entr${t.count===1?`y`:`ies`} as ${t.format}.`,N(`TRACE_EXPORTED (${t.format})`)}),x.addEventListener(`trace-preset-applied`,e=>{let t=e.detail;S.textContent=`Applied trace preset: ${t.preset}`,N(`TRACE_PRESET (${t.preset})`)});let M=()=>{let e=k.snapshot();return ue(C,e),x.entries=k.traceEntries(),e},N=(e,t)=>j.append(e,t),Ce=(e,n)=>{try{k.loadDeck(t.value);let r=M();S.textContent=`${e} Active card: ${r.activeCardId}`,N(`LOAD (${n})`,r)}catch(e){S.textContent=`Load error: ${String(e)}`;let t=M();N(`LOAD_ERROR (${n}) ${String(e)}`,t)}},P=e=>{try{k.pressKey(e);let t=M();S.textContent=`Key "${e}" applied. Active card: ${t.activeCardId}`,N(`KEY ${e}`,t)}catch(t){S.textContent=`Key error (${e}): ${String(t)}`;let n=M();N(`KEY_ERROR ${e} ${String(t)}`,n)}},F=$e;p.value=String(F);let I=null,L=()=>{let e=I!==null;m.setAttribute(`aria-pressed`,e?`true`:`false`),m.textContent=e?`Auto Tick: On (${F}ms)`:`Auto Tick: Off`},R=e=>{if(I&&(clearInterval(I),I=null,L(),e)){let t=M();S.textContent=e,N(`AUTO_TICK_STOP`,t)}},z=null;r.addEventListener(`change`,()=>{let e=r.value,n=_e.get(e);n&&(A=e,j.setActiveExample(e),t.value=n.wml,fe(ve,n),N(`EXAMPLE_SELECTED`),Ce(`Loaded example: ${e}.`,`example-select`))}),T.addEventListener(`click`,()=>ye.toggle()),a.addEventListener(`click`,()=>be.toggle()),v.addEventListener(`click`,()=>xe.toggle()),ie.addEventListener(`click`,()=>Se.toggle()),n.addEventListener(`click`,()=>{Ce(`Deck reloaded.`,`manual-reload`)}),t.addEventListener(`input`,()=>{o.checked&&(z&&clearTimeout(z),z=setTimeout(()=>{Ce(`Live reload complete.`,`live-reload`),z=null},Qe))}),c.addEventListener(`click`,()=>P(`up`)),l.addEventListener(`click`,()=>P(`down`)),u.addEventListener(`click`,()=>P(`enter`));let B=(e,t=`manual`)=>{try{let n=k.snapshot().activeCardId;k.advanceTimeMs(e);let r=M();if(t===`manual`){S.textContent=`Advanced timer clock by ${e}ms. Active card: ${r.activeCardId}`,N(`TICK ${e}ms`,r);return}r.activeCardId!==n&&(S.textContent=`Auto tick advanced card: ${n} -> ${r.activeCardId}`,N(`AUTO_TICK_NAV ${n}->${r.activeCardId}`,r))}catch(n){let r=M();if(t===`auto`){R(),S.textContent=`Auto tick error (${e}ms): ${String(n)}`,N(`AUTO_TICK_ERROR ${e}ms ${String(n)}`,r);return}S.textContent=`Tick error (${e}ms): ${String(n)}`,N(`TICK_ERROR ${e}ms ${String(n)}`,r)}},V=()=>{if(I)return;I=setInterval(()=>B(F,`auto`),F),L();let e=M();S.textContent=`Auto tick started (${F}ms).`,N(`AUTO_TICK_START`,e)};d.addEventListener(`click`,()=>B(100)),f.addEventListener(`click`,()=>B(1e3)),p.addEventListener(`change`,()=>{let e=Number.parseInt(p.value,10);if(!et.has(e)){p.value=String(F);return}if(F=e,I){R(),V();return}L()}),m.addEventListener(`click`,()=>{if(I){R(`Auto tick stopped (${F}ms).`);return}V()}),s.addEventListener(`click`,()=>{let e=k.navigateBack(),t=M();S.textContent=e?`Back applied. Active card: ${t.activeCardId}`:`Back ignored (history empty).`,N(e?`BACK`:`BACK_EMPTY`,t)}),h.addEventListener(`click`,()=>{k.clearExternalNavigationIntent();let e=M();S.textContent=`External navigation intent cleared.`,N(`INTENT_CLEARED`,e)}),g.addEventListener(`click`,async()=>{let e=k.snapshot(),t=e.externalNavigationIntent;if(!t){S.textContent=`No external intent to copy.`,N(`INTENT_COPY_SKIPPED (none)`,e);return}try{await navigator.clipboard.writeText(t),S.textContent=`External intent URL copied.`,N(`INTENT_COPIED`,e)}catch(t){S.textContent=`Copy intent failed: ${String(t)}`,N(`INTENT_COPY_ERROR ${String(t)}`,e)}}),ee.addEventListener(`click`,()=>{try{let e=k.executeScriptRefFunction(`wavescript-fixtures.wmlsc`,`externalGo`),t=M();S.textContent=`executeScriptRefFunction externalGo => ok=${e.ok}; intent=${t.externalNavigationIntent??`(none)`}`,N(`SCRIPT_PROBE_EXECUTE externalGo`,t)}catch(e){let t=M();S.textContent=`executeScriptRefFunction error: ${String(e)}`,N(`SCRIPT_PROBE_EXECUTE_ERROR ${String(e)}`,t)}}),_.addEventListener(`click`,()=>{try{let e=k.invokeScriptRefFunction(`wavescript-fixtures.wmlsc`,`externalGo`),t=M();S.textContent=`invokeScriptRefFunction externalGo => nav=${e.effects.navigationIntent.type}; intent=${t.externalNavigationIntent??`(none)`}`,N(`SCRIPT_PROBE_INVOKE externalGo`,t)}catch(e){let t=M();S.textContent=`invokeScriptRefFunction error: ${String(e)}`,N(`SCRIPT_PROBE_INVOKE_ERROR ${String(e)}`,t)}}),y.addEventListener(`click`,()=>{j.clearActive(),S.textContent=`Cleared event log for example: ${A}`}),ne.addEventListener(`click`,()=>{let e=b.value===`json`?`json`:`txt`,t=j.exportActive(e);if(!t){S.textContent=`No events to export for example: ${A}`,N(`EVENT_LOG_EXPORT_SKIPPED (empty)`);return}pe(t),S.textContent=`Exported event log for example: ${A}`,N(`EVENT_LOG_EXPORTED`)}),window.addEventListener(`keydown`,e=>{if(e.target===t)return;let n=ce(e.key);n&&(e.preventDefault(),P(n))}),window.addEventListener(`beforeunload`,()=>{R()}),fe(ve,O),ye.apply(),be.apply(),xe.apply(),Se.apply(),L();let we=M();N(`BOOT`),N(`INITIAL_LOAD`,we),j.renderActive()}tt().catch(e=>{let t=document.querySelector(`#status`);t&&(t.textContent=`Boot error: ${String(e)}`)});