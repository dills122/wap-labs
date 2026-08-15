var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var n=t({wavenavCatchEngineTrap:()=>r});function r(e){try{return e(),!1}catch{return!0}}var i=class{__destroy_into_raw(){let e=this.__wbg_ptr;return this.__wbg_ptr=0,s.unregister(this),e}free(){let e=this.__destroy_into_raw();O.__wbg_wmlengine_free(e,0)}activeCardId(){let e,t;try{let i=O.wmlengine_activeCardId(this.__wbg_ptr);var n=i[0],r=i[1];if(i[3])throw n=0,r=0,x(i[2]);return e=n,t=r,m(n,r)}finally{O.__wbindgen_free(e,t,1)}}activeCardLanguage(){let e=O.wmlengine_activeCardLanguage(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}advanceTimeMs(e){let t=O.wmlengine_advanceTimeMs(this.__wbg_ptr,e);if(t[1])throw x(t[0])}baseUrl(){let e,t;try{let n=O.wmlengine_baseUrl(this.__wbg_ptr);return e=n[0],t=n[1],m(n[0],n[1])}finally{O.__wbindgen_free(e,t,1)}}beginFocusedInputEdit(){let e=O.wmlengine_beginFocusedInputEdit(this.__wbg_ptr);if(e[2])throw x(e[1]);return e[0]!==0}beginFocusedSelectEdit(){let e=O.wmlengine_beginFocusedSelectEdit(this.__wbg_ptr);if(e[2])throw x(e[1]);return e[0]!==0}browserContextEpoch(){return O.wmlengine_browserContextEpoch(this.__wbg_ptr)>>>0}cancelFocusedInputEdit(){return O.wmlengine_cancelFocusedInputEdit(this.__wbg_ptr)!==0}cancelFocusedSelectEdit(){return O.wmlengine_cancelFocusedSelectEdit(this.__wbg_ptr)!==0}clearExternalNavigationIntent(){O.wmlengine_clearExternalNavigationIntent(this.__wbg_ptr)}clearScriptEntryPoints(){O.wmlengine_clearScriptEntryPoints(this.__wbg_ptr)}clearScriptUnits(){O.wmlengine_clearScriptUnits(this.__wbg_ptr)}clearTraceEntries(){O.wmlengine_clearTraceEntries(this.__wbg_ptr)}commitFocusedInputEdit(){let e=O.wmlengine_commitFocusedInputEdit(this.__wbg_ptr);if(e[2])throw x(e[1]);return e[0]!==0}commitFocusedSelectEdit(){let e=O.wmlengine_commitFocusedSelectEdit(this.__wbg_ptr);if(e[2])throw x(e[1]);return e[0]!==0}contentType(){let e,t;try{let n=O.wmlengine_contentType(this.__wbg_ptr);return e=n[0],t=n[1],m(n[0],n[1])}finally{O.__wbindgen_free(e,t,1)}}deckLanguage(){let e=O.wmlengine_deckLanguage(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}executeScriptRef(e){let t=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),n=D,r=O.wmlengine_executeScriptRef(this.__wbg_ptr,t,n);if(r[2])throw x(r[1]);return x(r[0])}executeScriptRefCall(e,t,n){let r=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),i=D,a=b(t,O.__wbindgen_malloc,O.__wbindgen_realloc),o=D,s=O.wmlengine_executeScriptRefCall(this.__wbg_ptr,r,i,a,o,n);if(s[2])throw x(s[1]);return x(s[0])}executeScriptRefFunction(e,t){let n=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),r=D,i=b(t,O.__wbindgen_malloc,O.__wbindgen_realloc),a=D,o=O.wmlengine_executeScriptRefFunction(this.__wbg_ptr,n,r,i,a);if(o[2])throw x(o[1]);return x(o[0])}executeScriptUnit(e){let t=y(e,O.__wbindgen_malloc),n=D,r=O.wmlengine_executeScriptUnit(this.__wbg_ptr,t,n);if(r[2])throw x(r[1]);return x(r[0])}externalNavigationIntent(){let e=O.wmlengine_externalNavigationIntent(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}externalNavigationRequestPolicy(){let e=O.wmlengine_externalNavigationRequestPolicy(this.__wbg_ptr);if(e[2])throw x(e[1]);return x(e[0])}focusedInputEditName(){let e=O.wmlengine_focusedInputEditName(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}focusedInputEditValue(){let e=O.wmlengine_focusedInputEditValue(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}focusedLinkIndex(){return O.wmlengine_focusedLinkIndex(this.__wbg_ptr)>>>0}focusedSelectEditName(){let e=O.wmlengine_focusedSelectEditName(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}focusedSelectEditValue(){let e=O.wmlengine_focusedSelectEditValue(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}getVar(e){let t=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),n=D,r=O.wmlengine_getVar(this.__wbg_ptr,t,n),i;return r[0]!==0&&(i=m(r[0],r[1]),O.__wbindgen_free(r[0],r[1]*1,1)),i}handleInput(e){let t=O.wmlengine_handleInput(this.__wbg_ptr,e);if(t[1])throw x(t[0])}handleKey(e){let t=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),n=D,r=O.wmlengine_handleKey(this.__wbg_ptr,t,n);if(r[1])throw x(r[0])}historyPushSequence(){return O.wmlengine_historyPushSequence(this.__wbg_ptr)>>>0}invokeScriptRef(e){let t=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),n=D,r=O.wmlengine_invokeScriptRef(this.__wbg_ptr,t,n);if(r[2])throw x(r[1]);return x(r[0])}invokeScriptRefCall(e,t,n){let r=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),i=D,a=b(t,O.__wbindgen_malloc,O.__wbindgen_realloc),o=D,s=O.wmlengine_invokeScriptRefCall(this.__wbg_ptr,r,i,a,o,n);if(s[2])throw x(s[1]);return x(s[0])}invokeScriptRefFunction(e,t){let n=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),r=D,i=b(t,O.__wbindgen_malloc,O.__wbindgen_realloc),a=D,o=O.wmlengine_invokeScriptRefFunction(this.__wbg_ptr,n,r,i,a);if(o[2])throw x(o[1]);return x(o[0])}lastBackNavigationHandled(){return O.wmlengine_lastBackNavigationHandled(this.__wbg_ptr)!==0}lastRuntimeFailureCode(){let e=O.wmlengine_lastRuntimeFailureCode(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}lastRuntimeFailureMessage(){let e=O.wmlengine_lastRuntimeFailureMessage(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptDialogRequests(){let e=O.wmlengine_lastScriptDialogRequests(this.__wbg_ptr);if(e[2])throw x(e[1]);return x(e[0])}lastScriptExecutionErrorCategory(){let e=O.wmlengine_lastScriptExecutionErrorCategory(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptExecutionErrorClass(){let e=O.wmlengine_lastScriptExecutionErrorClass(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptExecutionOk(){let e=O.wmlengine_lastScriptExecutionOk(this.__wbg_ptr);return e===16777215?void 0:e!==0}lastScriptExecutionTrap(){let e=O.wmlengine_lastScriptExecutionTrap(this.__wbg_ptr),t;return e[0]!==0&&(t=m(e[0],e[1]),O.__wbindgen_free(e[0],e[1]*1,1)),t}lastScriptRequiresRefresh(){let e=O.wmlengine_lastScriptRequiresRefresh(this.__wbg_ptr);return e===16777215?void 0:e!==0}lastScriptTimerRequests(){let e=O.wmlengine_lastScriptTimerRequests(this.__wbg_ptr);if(e[2])throw x(e[1]);return x(e[0])}lastWmlLoadDiagnostics(){let e=O.wmlengine_lastWmlLoadDiagnostics(this.__wbg_ptr);if(e[2])throw x(e[1]);return x(e[0])}loadDeck(e){let t=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),n=D,r=O.wmlengine_loadDeck(this.__wbg_ptr,t,n);if(r[1])throw x(r[0])}loadDeckContext(e,t,n,r,i){let a=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),o=D,s=b(t,O.__wbindgen_malloc,O.__wbindgen_realloc),c=D,l=b(n,O.__wbindgen_malloc,O.__wbindgen_realloc),u=D;var d=v(r)?0:b(r,O.__wbindgen_malloc,O.__wbindgen_realloc),f=D,p=v(i)?0:b(i,O.__wbindgen_malloc,O.__wbindgen_realloc),m=D;let h=O.wmlengine_loadDeckContext(this.__wbg_ptr,a,o,s,c,l,u,d,f,p,m);if(h[1])throw x(h[0])}loadDeckContextForNavigation(e,t,n,r,i,a,o){let s=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),c=D,l=b(t,O.__wbindgen_malloc,O.__wbindgen_realloc),u=D,d=b(n,O.__wbindgen_malloc,O.__wbindgen_realloc),f=D;var p=v(r)?0:b(r,O.__wbindgen_malloc,O.__wbindgen_realloc),m=D,h=v(i)?0:b(i,O.__wbindgen_malloc,O.__wbindgen_realloc),g=D,_=v(a)?0:b(a,O.__wbindgen_malloc,O.__wbindgen_realloc),ee=D,y=v(o)?0:b(o,O.__wbindgen_malloc,O.__wbindgen_realloc),S=D;let C=O.wmlengine_loadDeckContextForNavigation(this.__wbg_ptr,s,c,l,u,d,f,p,m,h,g,_,ee,y,S);if(C[1])throw x(C[0])}moveFocusedSelectEdit(e){return O.wmlengine_moveFocusedSelectEdit(this.__wbg_ptr,e)!==0}navigateBack(){return O.wmlengine_navigateBack(this.__wbg_ptr)!==0}navigateToCard(e){let t=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),n=D,r=O.wmlengine_navigateToCard(this.__wbg_ptr,t,n);if(r[1])throw x(r[0])}nextTimerWakeupMs(){let e=O.wmlengine_nextTimerWakeupMs(this.__wbg_ptr);return e===2**53-1?void 0:e}registerScriptEntryPoint(e,t,n){let r=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),i=D,a=b(t,O.__wbindgen_malloc,O.__wbindgen_realloc),o=D;O.wmlengine_registerScriptEntryPoint(this.__wbg_ptr,r,i,a,o,n)}registerScriptUnit(e,t){let n=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),r=D,i=y(t,O.__wbindgen_malloc),a=D;O.wmlengine_registerScriptUnit(this.__wbg_ptr,n,r,i,a)}render(){let e=O.wmlengine_render(this.__wbg_ptr);if(e[2])throw x(e[1]);return x(e[0])}renderFrame(){let e=O.wmlengine_renderFrame(this.__wbg_ptr);if(e[2])throw x(e[1]);return x(e[0])}setFocusedInputEditDraft(e){let t=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),n=D;return O.wmlengine_setFocusedInputEditDraft(this.__wbg_ptr,t,n)!==0}setVar(e,t){let n=b(e,O.__wbindgen_malloc,O.__wbindgen_realloc),r=D,i=b(t,O.__wbindgen_malloc,O.__wbindgen_realloc),a=D;return O.wmlengine_setVar(this.__wbg_ptr,n,r,i,a)!==0}setViewportCols(e){let t=O.wmlengine_setViewportCols(this.__wbg_ptr,e);if(t[1])throw x(t[0])}traceEntries(){let e=O.wmlengine_traceEntries(this.__wbg_ptr);if(e[2])throw x(e[1]);return x(e[0])}constructor(){let e=O.wmlengine_wasm_new();return this.__wbg_ptr=e,s.register(this,this.__wbg_ptr,this),this}};Symbol.dispose&&(i.prototype[Symbol.dispose]=i.prototype.free);function a(){return{__proto__:null,"./wavenav_engine_bg.js":{__proto__:null,__wbg_Error_408e67f47ca7b58b:function(e,t){return Error(m(e,t))},__wbg_String_8564e559799eccda:function(e,t){let n=b(String(t),O.__wbindgen_malloc,O.__wbindgen_realloc),r=D;p().setInt32(e+4,r,!0),p().setInt32(e+0,n,!0)},__wbg___wbindgen_bigint_get_as_i64_c4ecf48528083721:function(e,t){let n=t,r=typeof n==`bigint`?n:void 0;p().setBigInt64(e+8,v(r)?BigInt(0):r,!0),p().setInt32(e+0,!v(r),!0)},__wbg___wbindgen_boolean_get_c9c83ebd41b34df3:function(e){let t=e,n=typeof t==`boolean`?t:void 0;return v(n)?16777215:+!!n},__wbg___wbindgen_debug_string_a57024b9c6e4a48b:function(e,t){let n=b(u(t),O.__wbindgen_malloc,O.__wbindgen_realloc),r=D;p().setInt32(e+4,r,!0),p().setInt32(e+0,n,!0)},__wbg___wbindgen_in_ac983077f137f2e6:function(e,t){return e in t},__wbg___wbindgen_is_bigint_8ffbbef442139384:function(e){return typeof e==`bigint`},__wbg___wbindgen_is_function_5e4570eb24ffa122:function(e){return typeof e==`function`},__wbg___wbindgen_is_object_a2790eb24c211ea0:function(e){let t=e;return typeof t==`object`&&!!t},__wbg___wbindgen_jsval_eq_0a18949a61670320:function(e,t){return e===t},__wbg___wbindgen_jsval_loose_eq_acf2776254a8d832:function(e,t){return e==t},__wbg___wbindgen_number_get_136b9679cab35cfb:function(e,t){let n=t,r=typeof n==`number`?n:void 0;p().setFloat64(e+8,v(r)?0:r,!0),p().setInt32(e+0,!v(r),!0)},__wbg___wbindgen_string_get_d154f1e671052120:function(e,t){let n=t,r=typeof n==`string`?n:void 0;var i=v(r)?0:b(r,O.__wbindgen_malloc,O.__wbindgen_realloc),a=D;p().setInt32(e+4,a,!0),p().setInt32(e+0,i,!0)},__wbg___wbindgen_throw_bb96b2010945f0bc:function(e,t){throw Error(m(e,t))},__wbg__wbg_cb_unref_be22cc64ae6946a0:function(e){e._wbg_cb_unref()},__wbg_call_1c5886ab9c57d1c7:function(){return _(function(e,t){return e.call(t)},arguments)},__wbg_done_669171204c3dcae2:function(e){return e.done},__wbg_entries_7774d489e1da5f4f:function(e){return Object.entries(e)},__wbg_get_c0c8f8d7da0c03dd:function(e,t){return e[t>>>0]},__wbg_get_d173c0308df22d37:function(){return _(function(e,t){return Reflect.get(e,t)},arguments)},__wbg_get_unchecked_e20b893aeafc3fca:function(e,t){return e[t>>>0]},__wbg_instanceof_ArrayBuffer_993d02d2d254cad1:function(e){let t;try{t=e instanceof ArrayBuffer}catch{t=!1}return t},__wbg_instanceof_Map_9a4d6ead180ae3a9:function(e){let t;try{t=e instanceof Map}catch{t=!1}return t},__wbg_instanceof_Uint8Array_f935dbb0aa7cdeed:function(e){let t;try{t=e instanceof Uint8Array}catch{t=!1}return t},__wbg_isArray_6339f732981044bf:function(e){return Array.isArray(e)},__wbg_isSafeInteger_f3d6cd19ccfe4512:function(e){return Number.isSafeInteger(e)},__wbg_iterator_5cebbb86e33c6dd6:function(){return Symbol.iterator},__wbg_length_36bd29c6848c2144:function(e){return e.length},__wbg_length_ecfa2c63d3d0d82c:function(e){return e.length},__wbg_new_116be93542d39019:function(){return[]},__wbg_new_77cc4f4f472aeb81:function(e){return new Uint8Array(e)},__wbg_new_ebe3e0f6837f0879:function(){return{}},__wbg_next_42cf16ee0dafc9e2:function(){return _(function(e){return e.next()},arguments)},__wbg_next_8f26b64fa5e9f64b:function(e){return e.next},__wbg_prototypesetcall_de8e0d9553586985:function(e,t,n){Uint8Array.prototype.set.call(d(e,t),n)},__wbg_set_6be42768c690e380:function(e,t,n){e[t]=n},__wbg_set_a80955eb93b145c6:function(e,t,n){e[t>>>0]=n},__wbg_value_1e2369fab29b420e:function(e){return e.value},__wbindgen_cast_0000000000000001:function(e,t){return ee(e,t,o)},__wbindgen_cast_0000000000000002:function(e){return e},__wbindgen_cast_0000000000000003:function(e){return e},__wbindgen_cast_0000000000000004:function(e,t){return m(e,t)},__wbindgen_cast_0000000000000005:function(e){return BigInt.asUintN(64,e)},__wbindgen_init_externref_table:function(){let e=O.__wbindgen_externrefs,t=e.grow(4);e.set(0,void 0),e.set(t+0,void 0),e.set(t+1,null),e.set(t+2,!0),e.set(t+3,!1)}},"./snippets/wavenav_engine-d922c8e1bc417ffc/inline0.js":n}}function o(e,t){O.wasm_bindgen_acf6b922c9a0be53___convert__closures_____invoke_______true_(e,t)}var s=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>O.__wbg_wmlengine_free(e,1));function c(e){let t=O.__externref_table_alloc();return O.__wbindgen_externrefs.set(t,e),t}var l=typeof FinalizationRegistry>`u`?{register:()=>{},unregister:()=>{}}:new FinalizationRegistry(e=>O.__wbindgen_destroy_closure(e.a,e.b));function u(e){let t=typeof e;if(t==`number`||t==`boolean`||e==null)return`${e}`;if(t==`string`)return`"${e}"`;if(t==`symbol`){let t=e.description;return t==null?`Symbol`:`Symbol(${t})`}if(t==`function`){let t=e.name;return typeof t==`string`&&t.length>0?`Function(${t})`:`Function`}if(Array.isArray(e)){let t=e.length,n=`[`;t>0&&(n+=u(e[0]));for(let r=1;r<t;r++)n+=`, `+u(e[r]);return n+=`]`,n}let n=/\[object ([^\]]+)\]/.exec(toString.call(e)),r;if(n&&n.length>1)r=n[1];else return toString.call(e);if(r==`Object`)try{return`Object(`+JSON.stringify(e)+`)`}catch{return`Object`}return e instanceof Error?`${e.name}: ${e.message}\n${e.stack}`:r}function d(e,t){return e>>>=0,g().subarray(e/1,e/1+t)}var f=null;function p(){return(f===null||f.buffer.detached===!0||f.buffer.detached===void 0&&f.buffer!==O.memory.buffer)&&(f=new DataView(O.memory.buffer)),f}function m(e,t){return T(e>>>0,t)}var h=null;function g(){return(h===null||h.byteLength===0)&&(h=new Uint8Array(O.memory.buffer)),h}function _(e,t){try{return e.apply(this,t)}catch(e){let t=c(e);O.__wbindgen_exn_store(t)}}function v(e){return e==null}function ee(e,t,n){let r={a:e,b:t,cnt:1},i=(...e)=>{r.cnt++;let t=r.a;r.a=0;try{return n(t,r.b,...e)}finally{r.a=t,i._wbg_cb_unref()}};return i._wbg_cb_unref=()=>{--r.cnt===0&&(O.__wbindgen_destroy_closure(r.a,r.b),r.a=0,l.unregister(r))},l.register(i,r,r),i}function y(e,t){let n=t(e.length*1,1)>>>0;return g().set(e,n/1),D=e.length,n}function b(e,t,n){if(n===void 0){let n=E.encode(e),r=t(n.length,1)>>>0;return g().subarray(r,r+n.length).set(n),D=n.length,r}let r=e.length,i=t(r,1)>>>0,a=g(),o=0;for(;o<r;o++){let t=e.charCodeAt(o);if(t>127)break;a[i+o]=t}if(o!==r){o!==0&&(e=e.slice(o)),i=n(i,r,r=o+e.length*3,1)>>>0;let t=g().subarray(i+o,i+r),a=E.encodeInto(e,t);o+=a.written,i=n(i,r,o,1)>>>0}return D=o,i}function x(e){let t=O.__wbindgen_externrefs.get(e);return O.__externref_table_dealloc(e),t}var S=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0});S.decode();var C=2146435072,w=0;function T(e,t){return w+=t,w>=C&&(S=new TextDecoder(`utf-8`,{ignoreBOM:!0,fatal:!0}),S.decode(),w=t),S.decode(g().subarray(e,e+t))}var E=new TextEncoder;`encodeInto`in E||(E.encodeInto=function(e,t){let n=E.encode(e);return t.set(n),{read:e.length,written:n.length}});var D=0,O;function te(e,t){return O=e.exports,f=null,h=null,O.__wbindgen_start(),O}async function ne(e,t){if(typeof Response==`function`&&e instanceof Response){if(!e.ok)throw Error(`failed to fetch Wasm: ${e.status} ${e.statusText} fetching '${e.url}'`);if(typeof WebAssembly.instantiateStreaming==`function`)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if(n(e.type)&&e.headers.get(`Content-Type`)!==`application/wasm`)console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",t);else throw t}let r=await e.arrayBuffer();return await WebAssembly.instantiate(r,t)}{let n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}function n(e){switch(e){case`basic`:case`cors`:case`default`:return!0}return!1}}async function re(e){if(O!==void 0)return O;e!==void 0&&(Object.getPrototypeOf(e)===Object.prototype?{module_or_path:e}=e:console.warn(`using deprecated parameters for the initialization function; pass a single object instead`)),e===void 0&&(e=new URL(``+new URL(`wavenav_engine_bg-CLYGAvbw.wasm`,import.meta.url).href,``+import.meta.url));let t=a();(typeof e==`string`||typeof Request==`function`&&e instanceof Request||typeof URL==`function`&&e instanceof URL)&&(e=fetch(e));let{instance:n,module:r}=await ne(await e,t);return te(n,r)}var ie=`01 0F 00 6A 00 01 01 00 04 6D 61 69 6E 00 00 01 3B
`,ae=`01 2c 02 6a 02 00 00 00 2a 04 02 31 32 00 02 01 00 04 6d 61 69 6e 00 00 04 14 15 61 3a 02 01 0e e0 e1 21 42 e2 16 2d c4 51 50 20 3a 18 3a
`,oe=`01 0f 00 6a 00 01 01 00 04 6d 61 69 6e 00 00 01 37
`,se=16,ce=8,k=`http://local.test/deck.wml`,A=`text/vnd.wap.wml`,le=(e,t,n,r)=>{let i=e.getBoundingClientRect();if(!Number.isFinite(n)||!Number.isFinite(r)||i.width<=0||i.height<=0)return null;let a=n-i.left,o=r-i.top;if(a<0||o<0||a>=i.width||o>=i.height)return null;let s=a*e.width/i.width,c=o*e.height/i.height;return{type:`click`,frameId:t.frameId,x:Math.floor(s/ce),y:Math.floor(c/se)}},ue=(e,t)=>!Number.isFinite(t)||t===0?null:{type:`scroll`,frameId:e.frameId,deltaRows:t>0?1:-1};async function de(e,t){await re();let n=new i,r=n;r.setViewportCols(20),j(r),r.loadDeckContext(t,k,A);function a(){let t=e.getContext(`2d`);if(!t)return;t.clearRect(0,0,e.width,e.height),t.font=`14px "IBM Plex Mono", monospace`,t.textBaseline=`top`;let n=r.renderFrame();for(let r of n.rows){let n=r.index*se;for(let i of r.segments){let r=i.x*ce;if(i.type===`text`){t.fillStyle=`#171914`,t.fillText(i.text,r,n);continue}i.focused&&(t.fillStyle=`#d8dcef`,t.fillRect(0,n-1,e.width,18)),t.fillStyle=i.focused?`#171914`:`#1538a1`,t.fillText(i.text,r,n)}}}return a(),{loadDeck(e){r.loadDeckContext(e,k,A),j(r),a()},pressKey(e){r.handleKey(e),a()},advanceTimeMs(e){r.advanceTimeMs(e),a()},navigateBack(){let e=r.navigateBack();return a(),e},snapshot(){let e=r;return{activeCardId:r.activeCardId(),focusedLinkIndex:r.focusedLinkIndex(),baseUrl:r.baseUrl(),contentType:r.contentType(),nextTimerWakeupMs:r.nextTimerWakeupMs(),nextCardVar:r.getVar(`nextCard`),externalNavigationIntent:r.externalNavigationIntent(),externalNavigationRequestPolicy:e.externalNavigationRequestPolicy?.()??void 0,lastRuntimeFailureCode:e.lastRuntimeFailureCode?.()??void 0,lastRuntimeFailureMessage:e.lastRuntimeFailureMessage?.()??void 0,lastScriptDialogRequests:r.lastScriptDialogRequests(),lastScriptExecutionOk:r.lastScriptExecutionOk(),lastScriptExecutionTrap:r.lastScriptExecutionTrap(),lastScriptExecutionErrorClass:e.lastScriptExecutionErrorClass?.()??void 0,lastScriptExecutionErrorCategory:e.lastScriptExecutionErrorCategory?.()??void 0,lastScriptRequiresRefresh:r.lastScriptRequiresRefresh()}},renderFrame(){return r.renderFrame()},handleInput(e){r.handleInput(e),a()},clearExternalNavigationIntent(){r.clearExternalNavigationIntent()},getVar(e){return r.getVar(e)},setVar(e,t){return r.setVar(e,t)},executeScriptUnit(e){return r.executeScriptUnit(e)},registerScriptUnit(e,t){r.registerScriptUnit(e,t)},clearScriptUnits(){r.clearScriptUnits()},registerScriptEntryPoint(e,t,n){r.registerScriptEntryPoint(e,t,n)},clearScriptEntryPoints(){r.clearScriptEntryPoints()},invokeScriptRef(e){let t=r.invokeScriptRef(e);return(t.requiresRefresh||t.navigationIntent.type!==`none`)&&a(),t},invokeScriptRefFunction(e,t){let n=r.invokeScriptRefFunction(e,t);return(n.requiresRefresh||n.navigationIntent.type!==`none`)&&a(),n},invokeScriptRefCall(e,t,n){let i=r.invokeScriptRefCall(e,t,n);return(i.requiresRefresh||i.navigationIntent.type!==`none`)&&a(),i},executeScriptRef(e){return r.executeScriptRef(e)},executeScriptRefFunction(e,t){return r.executeScriptRefFunction(e,t)},executeScriptRefCall(e,t,n){return r.executeScriptRefCall(e,t,n)},lastScriptExecutionTrap(){return r.lastScriptExecutionTrap()},lastScriptExecutionOk(){return r.lastScriptExecutionOk()},lastScriptExecutionErrorClass(){return r.lastScriptExecutionErrorClass?.()},lastScriptExecutionErrorCategory(){return r.lastScriptExecutionErrorCategory?.()},lastScriptRequiresRefresh(){return r.lastScriptRequiresRefresh()},traceEntries(){return r.traceEntries()},clearTraceEntries(){r.clearTraceEntries()},getEngine(){return n}}}function j(e){e.clearScriptUnits(),e.clearScriptEntryPoints(),e.registerScriptUnit(`wap-193-minimal-return-es.wmlsc`,M(ie)),e.registerScriptUnit(`wap-193-operator-conversions.wmlsc`,M(ae)),e.registerScriptUnit(`wap-193-stack-underflow.wmlsc`,M(oe)),e.registerScriptUnit(`wmlbrowser-demo.wmlsc`,new Uint8Array([3,8,110,101,120,116,67,97,114,100,3,5,35,110,101,120,116,32,2,2,3,5,35,110,101,120,116,32,3,1,0,32,4,0,0,3,8,110,101,120,116,67,97,114,100,32,1,1,0,3,8,110,101,120,116,67,97,114,100,32,11,0,32,2,2,0,3,8,110,101,120,116,67,97,114,100,3,11,98,101,102,111,114,101,82,101,115,101,116,32,2,2,32,10,0,32,4,0,0])),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`main`,0),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`back`,31),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`readNext`,35),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`readCurrentCard`,49),e.registerScriptEntryPoint(`wmlbrowser-demo.wmlsc`,`newContextPrev`,66),e.registerScriptUnit(`timer-dialog.wmlsc`,new Uint8Array([3,13,84,105,109,101,114,32,101,120,112,105,114,101,100,32,5,1,0])),e.registerScriptEntryPoint(`timer-dialog.wmlsc`,`showExpiryAlert`,0),e.registerScriptUnit(`wavescript-fixtures.wmlsc`,new Uint8Array([3,8,110,101,120,116,67,97,114,100,3,7,117,112,100,97,116,101,100,32,2,2,0,3,5,35,110,101,120,116,32,3,1,3,0,32,3,1,0,3,20,110,101,120,116,46,119,109,108,63,102,114,111,109,61,115,99,114,105,112,116,32,3,1,0,3,5,35,110,101,120,116,32,3,1,32,4,0,0,32,4,0,3,5,35,110,101,120,116,32,3,1,0])),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`refreshOnly`,0),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`goCancel`,23),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`externalGo`,39),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`goThenPrev`,65),e.registerScriptEntryPoint(`wavescript-fixtures.wmlsc`,`prevThenGo`,79)}function M(e){return new Uint8Array(e.trim().split(/\s+/u).map(e=>Number.parseInt(e,16)))}var fe=[{key:`acceptErrorRollback`,label:`Accept Error Rollback`,description:`Demonstrates deterministic rollback when accept-task navigation targets are invalid.`,goal:`Verify failed accept go action does not partially mutate runtime state.`,workItems:[`R0-02`],specItems:[`WML-18`,`WML-R-017`],testingAc:[`Enter "To broken accept" then Enter again.`,`Confirm action fails and activeCardId remains accept-broken.`,`Press Back and confirm activeCardId returns to home.`],flows:[{id:`failed-accept-go-rolls-back`,title:`Failed accept go action does not partially mutate runtime state`,target:`host-sample`,workItems:[`R0-02`],specItems:[`WML-18`,`WML-R-017`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-broken`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-broken`,focusedLinkIndex:0},statusIncludes:`The requested page action could not be completed.`}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>Rollback demo. <a href="#accept-broken">To broken accept</a></p>
  </card>

  <card id="accept-broken">
    <do type="accept"><go href="#missing"/></do>
    <p>Accept action should fail and keep this card active.</p>
  </card>
</wml>
`},{key:`acceptNoopOrdering`,label:`Accept Noop Ordering`,description:`Exercises accept-task ordering with an inactive noop binding alongside go/prev/refresh flows.`,goal:`Verify noop remains inactive without mutating navigation/history while other accept actions retain expected behavior.`,workItems:[`R0-02`],specItems:[`WML-18`,`WML-R-012`,`WML-R-015`,`WML-R-017`],testingAc:[`Enter "Accept go" then Enter again; activeCardId should become target.`,`Return home, enter "Accept prev" then Enter again; activeCardId should become home.`,`Enter "Accept refresh" then Enter; activeCardId should stay accept-refresh.`,`Enter "Accept noop" then Enter; activeCardId should stay accept-noop, history depth should not change, and no task action should activate.`],flows:[{id:`accept-noop-preserves-navigation-state`,title:`Accept noop leaves the active card and history deterministic`,target:`host-sample`,workItems:[`R0-02`],specItems:[`WML-18`,`WML-R-012`,`WML-R-015`,`WML-R-017`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:2}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:3}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-noop`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-noop`,focusedLinkIndex:0},traceKinds:[`KEY`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_BACK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      <a href="#accept-go">Accept go</a>
      <a href="#accept-prev">Accept prev</a>
      <a href="#accept-refresh">Accept refresh</a>
      <a href="#accept-noop">Accept noop</a>
    </p>
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
    <p>Enter should leave the inactive accept noop binding masked.</p>
  </card>

  <card id="target">
    <p>Reached via accept go.</p>
  </card>
</wml>
`},{key:`actionsDoOnevent`,label:`Do + Onevent Actions`,description:`Demonstrates accept softkey action and onenterforward event chaining through runtime action handling.`,goal:`Verify runtime executes card-level action/event href intents without host-side semantics.`,workItems:[`W0-01`],specItems:[`RQ-WMLS-018`],testingAc:[`Load the example and press Enter on the first card; activeCardId should move from home to trigger.`,`Confirm onenterforward on trigger executes immediately and activeCardId becomes final.`,`Confirm externalNavigationIntent remains (none) through the flow.`],flows:[{id:`accept-then-onenterforward-chain`,title:`Accept action then onenterforward chain to the final card`,target:`host-sample`,workItems:[`W0-01`],specItems:[`RQ-WMLS-018`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`final`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`,`ACTION_FRAGMENT`,`ACTION_FRAGMENT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
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
    <p>Final card reached via onenterforward. <a href="#home">Back home</a></p>
  </card>
</wml>
`},{key:`actionsPrevTaskModel`,label:`Prev Task Model`,description:"Demonstrates deterministic `<prev/>` handling for accept and intrinsic card-entry events.",goal:"Verify task-model `prev` actions are executed consistently in runtime-owned action/event plumbing.",workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`],testingAc:[`Press Enter on "To middle" and then Enter again; activeCardId should return to home (accept prev).`,`From home, Enter "To middle", then Enter "To next".`,`Press Back once; activeCardId should become home because middle runs onenterbackward prev.`],flows:[{id:`accept-and-onenterbackward-prev`,title:`Both accept-prev and onenterbackward-prev navigate deterministically`,target:`host-sample`,workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`mid-accept`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_PREV`,`ACTION_BACK`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`mid-back`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`,`ACTION_PREV`,`ACTION_BACK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      Prev task demo.
      <a href="#mid-accept">To middle (accept prev)</a>
      <a href="#mid-back">To middle (onenterbackward prev)</a>
    </p>
  </card>

  <card id="mid-accept">
    <do type="accept"><prev/></do>
    <p>No links on this card; Enter should invoke accept prev.</p>
  </card>

  <card id="mid-back">
    <onevent type="onenterbackward"><prev/></onevent>
    <p><a href="#next">To next</a></p>
  </card>

  <card id="next">
    <p>Use host Back to trigger onenterbackward prev in mid-back.</p>
  </card>
</wml>
`},{key:`actionsRefreshRollback`,label:`Refresh + Rollback`,description:"Demonstrates task-model `<refresh/>` execution and rollback behavior when entry-task actions fail.",goal:`Verify refresh does not mutate navigation state and failed onenterforward actions leave invoking card current.`,workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`,`WML-R-017`],testingAc:[`Press Enter on "To refresh card", then Enter again; activeCardId should stay refresh-card.`,`Press Back; activeCardId should return to home.`,`Press Down then Enter on "Broken forward entry"; load should fail and activeCardId should remain home.`],flows:[{id:`refresh-stays-and-failed-entry-rolls-back`,title:`Refresh stays on the current card and a failed entry task rolls back`,target:`host-sample`,workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`,`WML-R-017`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`refresh-card`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`refresh-card`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_REFRESH`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1},statusIncludes:`The requested page action could not be completed.`}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      Refresh + rollback demo.
      <a href="#refresh-card">To refresh card</a>
      <a href="#broken-forward">Broken forward entry</a>
    </p>
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
`},{key:`actionsTaskOrderRollback`,label:`Task Order + Rollback`,description:`Exercises accept-task ordering for go/prev/refresh and failure rollback when task navigation targets are invalid.`,goal:`Validate deterministic action trace ordering and no partial state mutation on failed task actions.`,workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`,`WML-R-017`],testingAc:[`Enter "Accept go" then Enter again; activeCardId should become target.`,`Back to home, enter "Accept prev" then Enter again; activeCardId should become home.`,`Enter "Accept refresh" then Enter; activeCardId should stay accept-refresh.`,`Enter "Accept broken" then Enter; action should error and activeCardId should remain accept-broken.`],flows:[{id:`accept-go-prev-refresh-and-rollback`,title:`Accept tasks preserve go, prev, refresh, and rollback ordering`,target:`host-sample`,workItems:[`A5-02`],specItems:[`WML-R-012`,`WML-R-015`,`WML-R-017`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-go`,focusedLinkIndex:0}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`target`,focusedLinkIndex:0},traceKinds:[`ACTION_ACCEPT`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`accept-go`,focusedLinkIndex:0}}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-prev`,focusedLinkIndex:0}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_ACCEPT`,`ACTION_PREV`,`ACTION_BACK`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:2}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-refresh`,focusedLinkIndex:0}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-refresh`,focusedLinkIndex:0},traceKinds:[`ACTION_ACCEPT`,`ACTION_REFRESH`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:2}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:3}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-broken`,focusedLinkIndex:0}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`accept-broken`,focusedLinkIndex:0},traceKinds:[`ACTION_ACCEPT`,`ACTION_FRAGMENT`],statusIncludes:`Key error (enter):`}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_FRAGMENT`,`ACTION_BACK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      <a href="#accept-go">Accept go</a>
      <a href="#accept-prev">Accept prev</a>
      <a href="#accept-refresh">Accept refresh</a>
      <a href="#accept-broken">Accept broken</a>
    </p>
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
`},{key:`basic`,label:`Basic Navigation`,description:`Baseline navigation deck with one fragment link and one external link.`,goal:`Verify fragment transitions mutate active card while external links only emit host intent.`,workItems:[`A2-01`,`A2-02`,`F2-03`],specItems:[`WML-R-006`,`WML-R-007`],testingAc:[`Load the example and press Enter on "Go to next card"; activeCardId should become next.`,`Press Enter on "Return home"; activeCardId should become home.`,`Move focus to "External link" and press Enter; activeCardId should remain home.`,`Confirm runtime-state shows externalNavigationIntent as http://example.com/other.wml.`],flows:[{id:`fragment-and-external-intent`,title:`Fragment navigation and external intent stay separate`,target:`host-sample`,workItems:[`A2-01`,`A2-02`,`F2-03`],specItems:[`WML-R-006`,`WML-R-007`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1,externalNavigationIntent:null}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1,externalNavigationIntent:`http://example.com/other.wml`},traceKinds:[`ACTION_EXTERNAL`]}}]},{id:`waves-fragment-and-external-intent`,title:`Waves UI drives fragment navigation and captures external intent`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`A2-01`,`A2-02`,`F2-03`],specItems:[`WML-R-006`,`WML-R-007`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null},session:{runMode:`local`,navigationStatus:`loaded`},render:{textIncludes:[`WaveNav Host Harness`,`Go to next card`]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`Second card loaded.`,`Return home`]}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0}}},{action:{type:`keyboard`,key:`ArrowDown`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1,externalNavigationIntent:`http://example.com/other.wml`},traceKinds:[`ACTION_EXTERNAL`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>WaveNav Host Harness</p>
    <p>
      Use ArrowUp / ArrowDown / Enter.<br/>
      <a href="#next">Go to next card</a><br/>
      <a href="http://example.com/other.wml">External link (emits host intent)</a>
    </p>
  </card>
  <card id="next">
    <p>Second card loaded. <a href="#home">Return home</a></p>
  </card>
</wml>
`},{key:`cardEntryForwardBackward`,label:`Card Entry Forward+Backward`,description:`Demonstrates deterministic re-entry behavior when a card defines both onenterforward and onenterbackward handlers.`,goal:`Confirm forward entry and backward re-entry actions trigger at the expected navigation boundaries.`,workItems:[`A2-03`],specItems:[`WML-R-008`],testingAc:[`Press Enter on "Enter transit"; activeCardId should become next because transit runs onenterforward.`,`Press Back once; activeCardId should become rewind because transit runs onenterbackward on re-entry.`,`Confirm runtime trace shows ACTION_BACK and subsequent ACTION_FRAGMENT for rewind.`],flows:[{id:`forward-entry-and-backward-reentry`,title:`Forward entry and backward re-entry dispatch at card boundaries`,target:`host-sample`,workItems:[`A2-03`],specItems:[`WML-R-008`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`ACTION_FRAGMENT`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`rewind`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`,`ACTION_FRAGMENT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>Start card. <a href="#transit">Enter transit</a></p>
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
    <p>Reached from onenterbackward. <a href="#home">Return home</a></p>
  </card>
</wml>
`},{key:`externalNavigationIntent`,label:`External Navigation Intent`,description:`Focused demo of external intent emission for relative and absolute links.`,goal:`Validate URL intent resolution and confirm fragment behavior remains separate.`,workItems:[`A2-02`],specItems:[`WML-R-007`],testingAc:[`Press Enter on "Relative external link" and confirm activeCardId stays home.`,`Confirm externalNavigationIntent resolves to the base directory plus next.wml?from=home.`,`Press Down then Enter on "Absolute external link" and confirm intent is exactly https://example.org/absolute.`,`Press Down then Enter on "Internal fragment link" and confirm activeCardId becomes details.`],flows:[{id:`relative-absolute-and-fragment-links`,title:`Relative and absolute external links emit intent while fragment nav stays separate`,target:`host-sample`,workItems:[`A2-02`],specItems:[`WML-R-007`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:`http://local.test/next.wml?from=home`},traceKinds:[`KEY`,`ACTION_EXTERNAL`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1,externalNavigationIntent:`https://example.org/absolute`},traceKinds:[`KEY`,`ACTION_EXTERNAL`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:2}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`details`,focusedLinkIndex:0,externalNavigationIntent:`https://example.org/absolute`},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>External intent demo</p>
    <p>Enter on first link emits host intent only.</p>
    <p>
      <a href="next.wml?from=home">Relative external link</a>
      <br/>
      <a href="https://example.org/absolute">Absolute external link</a>
      <br/>
      <a href="#details">Internal fragment link</a>
    </p>
  </card>
  <card id="details">
    <p>Fragment navigation still changes active card. <a href="#home">Back home</a></p>
  </card>
</wml>
`},{key:`f201DeterministicClickInput`,label:`Deterministic Click Input`,description:`Exercises frame-bound pointer activation through engine-owned logical hit regions.`,goal:`Verify that a host-provided logical click coordinate activates the same link action as keyboard Enter without host-side WML lookup.`,workItems:[`F2-01`],specItems:[`WBP-08`],testingAc:[`The initial frame exposes one link hit region in engine column/row coordinates.`,`Clicking inside that region navigates to the second card.`,`The host sends only frame identity and logical coordinates to the engine.`],flows:[{id:`frame-bound-click-activates-link`,title:`Engine-owned hit region resolves pointer activation`,target:`host-sample`,workItems:[`F2-01`],specItems:[`WBP-08`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0},frame:{contractVersion:3,profileId:`class-c-reference`,cardId:`home`,hitRegions:[{x:0,y:0,width:4,height:1,actionId:`focus:0`,targetKind:`link`}],affordances:[{actionId:`focus:0`,label:`Open`,source:`focused-link`,control:`primary`,enabled:!0}]}},steps:[{action:{type:`click`,x:0,y:0},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p><a href="#next">Open</a></p>
  </card>
  <card id="next">
    <p>Pointer activation reached the next card.</p>
  </card>
</wml>
`},{key:`f202DeterministicScroll`,label:`Deterministic Viewport Scroll`,description:`Exercises engine-owned row windows and frame-bound scrolling across content longer than the Class C reference viewport.`,goal:`Verify that signed row deltas clamp deterministically and publish viewport-relative rows without host-side content interpretation.`,workItems:[`F2-02`],specItems:[`WBP-08`],testingAc:[`The initial frame exposes a 20-row viewport over 25 content rows.`,`Scrolling by three rows publishes offsetRow 3 with the same fixed visible-row window.`,`A large negative delta clamps the viewport back to offsetRow 0.`],flows:[{id:`scroll-window-clamps-and-replays`,title:`Engine-owned visible row window follows frame-bound scroll input`,target:`host-sample`,workItems:[`F2-02`],specItems:[`WBP-08`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0},frame:{contractVersion:3,profileId:`class-c-reference`,cardId:`home`,viewport:{cols:20,rows:20,offsetRow:0,contentRows:25},affordances:[]}},steps:[{action:{type:`scroll`,deltaRows:3},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},frame:{contractVersion:3,profileId:`class-c-reference`,cardId:`home`,viewport:{cols:20,rows:20,offsetRow:3,contentRows:25},affordances:[]}}},{action:{type:`scroll`,deltaRows:-99},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},frame:{contractVersion:3,profileId:`class-c-reference`,cardId:`home`,viewport:{cols:20,rows:20,offsetRow:0,contentRows:25},affordances:[]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>Row 00</p>
    <p>Row 01</p>
    <p>Row 02</p>
    <p>Row 03</p>
    <p>Row 04</p>
    <p>Row 05</p>
    <p>Row 06</p>
    <p>Row 07</p>
    <p>Row 08</p>
    <p>Row 09</p>
    <p>Row 10</p>
    <p>Row 11</p>
    <p>Row 12</p>
    <p>Row 13</p>
    <p>Row 14</p>
    <p>Row 15</p>
    <p>Row 16</p>
    <p>Row 17</p>
    <p>Row 18</p>
    <p>Row 19</p>
    <p>Row 20</p>
    <p>Row 21</p>
    <p>Row 22</p>
    <p>Row 23</p>
    <p>Row 24</p>
  </card>
</wml>
`},{key:`fieldOpenwave2011Navigation`,label:`Field Example (Openwave 2011)`,description:`Real-world style multi-card sample used to exercise parser ordering and fragment navigation.`,goal:`Ensure source ordering, inline link parsing, and card transitions stay deterministic on legacy-like content.`,workItems:[`A1-03`,`A2-01`],specItems:[`WML-R-002`,`WML-R-006`],testingAc:[`Load the deck and verify activeCardId starts at main.`,`Press Enter on "Here" and confirm activeCardId transitions to content.`,`Use Down and Enter on one of the external service links and verify activeCardId remains content.`,`Confirm runtime-state externalNavigationIntent updates when entering an external service link.`],flows:[{id:`legacy-content-fragment-and-external-links`,title:`Legacy-style source ordering keeps fragment and external navigation deterministic`,target:`host-sample`,workItems:[`A1-03`,`A2-01`],specItems:[`WML-R-002`,`WML-R-006`],initial:{state:{activeCardId:`main`,focusedLinkIndex:0,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`content`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`content`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`content`,focusedLinkIndex:1,externalNavigationIntent:`http://local.test/Lectures.wml`},traceKinds:[`KEY`,`ACTION_EXTERNAL`]}}]}],wml:`<?xml version="1.0"?>
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
`},{key:`formsSelectLocal`,label:`Forms Select (Local)`,description:`Local-mode form example for single-select option cycling, commit, cancel, and captured submit intent.`,goal:`Verify engine-owned select state cycles deterministically, survives commit/cancel, and feeds a local-only submit intent.`,workItems:[`A5-05`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-003`,`RQ-RMK-008`],testingAc:[`Load the example in Waves local mode and verify the default selected country is rendered.`,`Focus the Country select, press Enter, then ArrowDown to cycle through options.`,`Press Escape once and confirm the select returns to the original committed option.`,`Re-enter select edit, cycle to a new option, and press Enter to commit.`,`Move focus to the Notes field and press Enter to submit; confirm local mode captures the external intent with the committed Country value.`],flows:[{id:`select-cycle-cancel-commit-and-submit`,title:`Select edit cycles deterministically, survives cancel, and feeds a local submit intent`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`A5-05`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-003`,`RQ-RMK-008`],initial:{state:{activeCardId:`profile`,focusedLinkIndex:0,focusedSelectEditName:null},render:{textIncludes:[`Jordan`]}},steps:[{action:{type:`keyboard`,key:`Enter`},expect:{state:{focusedSelectEditName:`Country`,focusedSelectEditValue:`Jordan`}}},{action:{type:`keyboard`,key:`ArrowDown`},expect:{state:{focusedSelectEditName:`Country`,focusedSelectEditValue:`France`},render:{textIncludes:[`France`]}}},{action:{type:`keyboard`,key:`Escape`},expect:{state:{focusedSelectEditName:null,focusedSelectEditValue:null},render:{textIncludes:[`Jordan`]}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{focusedSelectEditName:`Country`,focusedSelectEditValue:`Jordan`}}},{action:{type:`keyboard`,key:`ArrowDown`},expect:{state:{focusedSelectEditName:`Country`,focusedSelectEditValue:`France`}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{focusedSelectEditName:null,focusedSelectEditValue:null,focusedLinkIndex:0},traceKinds:[`SELECT_EDIT_COMMIT`],render:{textIncludes:[`France`]}}},{action:{type:`key`,key:`down`},expect:{state:{focusedLinkIndex:1}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{externalNavigationIntent:`http://local.test/profile`,externalNavigationRequestPolicy:{refererUrl:`http://local.test/examples/formsSelectLocal.wml`,postContext:{sameDeck:!1,contentType:`application/x-www-form-urlencoded`,payload:`Country=France&notes=`},requestIntent:{method:`post`,enctype:`application/x-www-form-urlencoded`,sendReferer:!0,sameDeck:!1,postFields:[{name:`Country`,value:`France`},{name:`notes`,value:``}]}}},traceKinds:[`ACTION_ACCEPT`,`ACTION_EXTERNAL`],session:{runMode:`local`,navigationStatus:`loaded`,externalNavigationIntent:`http://local.test/profile`},statusIncludes:`Local mode captured external intent`}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="profile" title="Local Select">
    <do type="accept">
      <go method="post" href="/profile" sendreferer="true">
        <postfield name="Country" value="$(Country)"/>
        <postfield name="notes" value="$(notes)"/>
      </go>
    </do>
    <p>
      Country:
      <select name="Country" title="Country">
        <option value="Jordan">Jordan</option>
        <option value="France">France</option>
        <option value="Germany">Germany</option>
      </select>
    </p>
    <p>Notes: <input name="notes" value=""/></p>
  </card>
</wml>
`},{key:`formsSelectNavigationLocal`,label:`Forms Select + Navigation (Local)`,description:`Local-mode select example with surrounding links and inputs to verify entering, exiting, and moving focus away from select edit mode.`,goal:`Verify select edit can be engaged, committed or canceled, and then cleanly disengaged so focus navigation resumes across other page items.`,workItems:[`A5-05`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-003`,`RQ-RMK-008`],testingAc:[`Load the example in Waves local mode and confirm the first focus target is the "Help" link.`,`Move focus to the Country select, press Enter to begin edit, then ArrowDown to change the draft option.`,`Press Enter to commit and confirm a subsequent ArrowDown moves focus to the PIN input instead of changing Country again.`,`Re-enter Country edit, change the draft option, then press Escape and confirm the original committed option remains visible.`,`Submit the card and confirm Waves captures the local-mode external intent without fetching.`],flows:[{id:`waves-merged-select-and-input-edit`,title:`Waves combines softkey focus with keyboard select and input editing`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`A5-05`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-003`,`RQ-RMK-008`],initial:{state:{activeCardId:`profile`,focusedLinkIndex:0,focusedInputEditName:null,focusedSelectEditName:null},render:{textIncludes:[`Help`,`Jordan`,`PIN:`,`Review`]}},steps:[{action:{type:`key`,key:`down`},expect:{state:{focusedLinkIndex:1}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{focusedLinkIndex:1,focusedSelectEditName:`Country`,focusedSelectEditValue:`Jordan`}}},{action:{type:`keyboard`,key:`ArrowDown`},expect:{state:{focusedSelectEditName:`Country`,focusedSelectEditValue:`France`},render:{textIncludes:[`France`]}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{focusedLinkIndex:1,focusedSelectEditName:null,focusedSelectEditValue:null},render:{textIncludes:[`France`]}}},{action:{type:`key`,key:`down`},expect:{state:{focusedLinkIndex:2}}},{action:{type:`type-text`,text:`12`},expect:{state:{focusedInputEditName:`pin`,focusedInputEditValue:`12`},render:{textIncludes:[`**`]}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{focusedInputEditName:null,focusedInputEditValue:null,externalNavigationIntent:`http://local.test/profile`,externalNavigationRequestPolicy:{refererUrl:`http://local.test/examples/formsSelectNavigationLocal.wml`,postContext:{sameDeck:!1,contentType:`application/x-www-form-urlencoded`,payload:`Country=France&pin=12`},requestIntent:{method:`post`,enctype:`application/x-www-form-urlencoded`,sendReferer:!0,sameDeck:!1,postFields:[{name:`Country`,value:`France`},{name:`pin`,value:`12`}]}}},traceKinds:[`INPUT_EDIT_COMMIT`,`ACTION_ACCEPT`,`ACTION_EXTERNAL`],session:{runMode:`local`,navigationStatus:`loaded`,externalNavigationIntent:`http://local.test/profile`},statusIncludes:`Local mode captured external intent`,render:{textIncludes:[`**`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="profile" title="Select Navigation">
    <do type="accept">
      <go method="post" href="/profile" sendreferer="true">
        <postfield name="Country" value="$(Country)"/>
        <postfield name="pin" value="$(pin)"/>
      </go>
    </do>
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
`},{key:`formsTextSubmitLocal`,label:`Forms Text Submit (Local)`,description:`Local-mode form example for text and password input editing with captured POST intent.`,goal:`Verify engine-owned text form state commits deterministically and local mode captures submit intent without fetching.`,workItems:[`A5-04`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-008`],testingAc:[`Load the example in Waves local mode and confirm activeCardId starts at login.`,`Press Enter on the username field, type a new value, and press Enter to commit.`,`Move to the PIN field, type digits, and confirm the viewport masks the committed value.`,`Submit the card and confirm Waves reports a captured external intent instead of performing a fetch.`],flows:[{id:`waves-text-edit-and-local-submit-intent`,title:`Waves commits text and password edits into a captured local POST intent`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`A5-04`,`A5-06`],specItems:[`WML-R-019`,`RQ-RMK-008`],initial:{state:{activeCardId:`login`,focusedLinkIndex:0,focusedInputEditName:null,externalNavigationIntent:null},session:{runMode:`local`,navigationStatus:`loaded`},render:{textIncludes:[`AHMED`,`PIN:`]}},steps:[{action:{type:`type-text`,text:`BOB`},expect:{state:{focusedLinkIndex:0,focusedInputEditName:`username`,focusedInputEditValue:`AHMEDBOB`},render:{textIncludes:[`AHMEDBOB`]}}},{action:{type:`keyboard`,key:`ArrowDown`},expect:{state:{focusedLinkIndex:1,focusedInputEditName:null,focusedInputEditValue:null},traceKinds:[`INPUT_EDIT_START`,`INPUT_EDIT_COMMIT`]}},{action:{type:`type-text`,text:`42`},expect:{state:{focusedLinkIndex:1,focusedInputEditName:`pin`,focusedInputEditValue:`42`},render:{textIncludes:[`**`]}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{activeCardId:`login`,focusedInputEditName:null,focusedInputEditValue:null,externalNavigationIntent:`http://local.test/login`,externalNavigationRequestPolicy:{refererUrl:`http://local.test/examples/formsTextSubmitLocal.wml`,postContext:{sameDeck:!1,contentType:`application/x-www-form-urlencoded`,payload:`username=AHMEDBOB&pin=42`},requestIntent:{method:`post`,enctype:`application/x-www-form-urlencoded`,sendReferer:!0,sameDeck:!1,postFields:[{name:`username`,value:`AHMEDBOB`},{name:`pin`,value:`42`}]}}},traceKinds:[`INPUT_EDIT_COMMIT`,`ACTION_ACCEPT`,`ACTION_EXTERNAL`],session:{runMode:`local`,navigationStatus:`loaded`,externalNavigationIntent:`http://local.test/login`},statusIncludes:`Local mode captured external intent`,render:{textIncludes:[`AHMEDBOB`,`**`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="login" title="Local Login">
    <do type="accept">
      <go method="post" href="/login" sendreferer="true">
        <postfield name="username" value="$(username)"/>
        <postfield name="pin" value="$(pin)"/>
      </go>
    </do>
    <p>User: <input name="username" value="AHMED" type="text"/></p>
    <p>PIN: <input name="pin" value="" type="password"/></p>
  </card>
</wml>
`},{key:`historyBackProcessOrder`,label:`History Back Process Order`,description:`Exercises multi-step fragment navigation and deterministic back traversal order.`,goal:`Verify back traversal replays prior card order without skipping or mutating unrelated state.`,workItems:[`R0-02`,`R0-03`],specItems:[`WML-18`,`WML-07`,`WML-R-008`],testingAc:[`Navigate home -> level-1 -> level-2 using Enter.`,`Press Back once and confirm activeCardId is level-1.`,`Press Back again and confirm activeCardId is home.`,`Press Back on home and confirm no-op behavior with activeCardId still home.`],flows:[{id:`multi-card-back-process-order`,title:`Multi-card history unwinds in order and stops when empty`,target:`host-sample`,workItems:[`R0-02`,`R0-03`],specItems:[`WML-18`,`WML-07`,`WML-R-008`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`level-1`,focusedLinkIndex:0}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`level-2`,focusedLinkIndex:0}}},{action:{type:`back`},expect:{state:{activeCardId:`level-1`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`,`ACTION_BACK`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`,`ACTION_BACK_EMPTY`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>History process-order demo. <a href="#level-1">To level 1</a></p>
  </card>

  <card id="level-1">
    <p>Level 1 card. <a href="#level-2">To level 2</a></p>
  </card>

  <card id="level-2">
    <p>Level 2 card. <a href="#home">Return home via link</a></p>
  </card>
</wml>
`},{key:`historyBackStack`,label:`History Back Stack`,description:`Exercises fragment navigation history and host-triggered back navigation.`,goal:`Verify runtime pushes history on fragment transitions and pops deterministically through navigateBack.`,workItems:[`A2-03`],specItems:[`WML-R-008`],testingAc:[`Load the deck and press Enter on "Go to next"; activeCardId should become next.`,`Press Back; activeCardId should return to home.`,`Press Back again and confirm status reports history empty with activeCardId still home.`],flows:[{id:`fragment-back-and-empty-history`,title:`Fragment history pops once and then reports empty`,target:`host-sample`,workItems:[`A2-03`],specItems:[`WML-R-008`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`,`ACTION_BACK_EMPTY`]}}]},{id:`waves-fragment-back-and-empty-history`,title:`Waves keyboard back pops fragment history and reports empty history`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`A2-03`],specItems:[`WML-R-008`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0},render:{textIncludes:[`History baseline demo.`,`Go to next`]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},render:{textIncludes:[`Second card reached by fragment navigation.`]}}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`],statusIncludes:`engine history`}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`,`ACTION_BACK_EMPTY`],statusIncludes:`no back history`}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>History baseline demo. <a href="#next">Go to next</a></p>
  </card>
  <card id="next">
    <p>Second card reached by fragment navigation. <a href="#home">Return home via link</a></p>
  </card>
</wml>
`},{key:`missingFragment`,label:`Missing Fragment Error`,description:`Negative navigation case where a fragment target is absent.`,goal:`Verify missing fragment transitions fail deterministically without mutating runtime state.`,workItems:[`A2-01`],specItems:[`WML-R-006`],testingAc:[`Load the deck and confirm activeCardId is home.`,`Press Enter on "Broken target".`,`Confirm status shows a key error and activeCardId remains home.`,`Confirm focusedLinkIndex remains stable after the failed navigation.`],flows:[{id:`waves-network-missing-fragment-error`,title:`Waves fixture fetch preserves state when fragment navigation fails`,target:`waves-browser`,setup:{runMode:`network`},workItems:[`A2-01`],specItems:[`WML-R-006`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0},session:{runMode:`network`,navigationStatus:`loaded`,finalUrl:`http://fixtures.test/examples/missingFragment.wml`},render:{textIncludes:[`Missing fragment test`,`Broken target`]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`KEY`],session:{navigationStatus:`error`},statusIncludes:`Error:`,render:{textIncludes:[`Broken target`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>Missing fragment test <a href="#missing">Broken target</a></p>
  </card>
</wml>
`},{key:`onenterbackwardReentry`,label:`OnEnterBackward Reentry`,description:`Demonstrates card re-entry behavior when navigateBack lands on a card with onenterbackward.`,goal:`Verify backward navigation triggers onenterbackward deterministically before the user resumes input.`,workItems:[`A2-03`],specItems:[`WML-R-008`],testingAc:[`Press Enter on "To middle", then Enter on "To next"; activeCardId should become next.`,`Press Back once; activeCardId should become rewind (not middle) because mid defines onenterbackward.`,`Confirm runtime trace includes ACTION_BACK followed by ACTION_FRAGMENT for rewind.`],flows:[{id:`backward-entry-redirects-past-middle`,title:`Backward navigation triggers onenterbackward before the user resumes input`,target:`host-sample`,workItems:[`A2-03`],specItems:[`WML-R-008`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`mid`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`rewind`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`,`ACTION_FRAGMENT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>Start card. <a href="#mid">To middle</a></p>
  </card>
  <card id="mid">
    <onevent type="onenterbackward">
      <go href="#rewind"/>
    </onevent>
    <p>Middle card runs backward-entry action. <a href="#next">To next</a></p>
  </card>
  <card id="next">
    <p>Reached from middle.</p>
  </card>
  <card id="rewind">
    <p>Reached via onenterbackward. <a href="#home">Return home</a></p>
  </card>
</wml>
`},{key:`parserRobustness`,label:`Parser Robustness`,description:`Includes unsupported tags and valid card content to assert parser resilience.`,goal:`Confirm unsupported tags are ignored while valid nodes remain functional and navigable.`,workItems:[`A1-01`,`A1-03`],specItems:[`WML-R-001`,`WML-R-020`],testingAc:[`Load the deck and verify it renders without load errors.`,`Confirm activeCardId starts at home despite the unsupported <cardinal> node.`,`Press Enter on "Next" and confirm transition to next works.`,`Press Enter on "Back" and confirm transition to home works.`],flows:[{id:`unsupported-tag-ignored-and-navigable`,title:`Unsupported node is ignored while valid cards remain navigable`,target:`host-sample`,workItems:[`A1-01`,`A1-03`],specItems:[`WML-R-001`,`WML-R-020`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//VENDOR//DTD WML 1.3 PLUS//EN"
  "http://vendor.test/wml13-plus.dtd">
<wml>
  <cardinal id="noise">Ignore me</cardinal>
  <card id="home">
    <p>Hello <a href="#next">Next</a></p>
  </card>
  <card id="next">
    <p>Still works. <a href="#home">Back</a></p>
  </card>
</wml>
`},{key:`scriptLinkExecution`,label:`Script Link Execution`,description:`Runs a registered, verified WAP-193 operator/conversion unit through a script href and exposes execution outcome in runtime state.`,goal:`Validate runtime routes a named WAP-193 function through verification and bounded language execution.`,workItems:[`W0-01`,`W0-03`,`W1-02`,`W1-04`,`WMLS-501`,`WMLS-502`],specItems:[`RQ-WMLS-001`,`RQ-WMLS-004`,`RQ-WMLS-005`,`RQ-WMLS-006`,`RQ-WMLS-008`,`RQ-WMLS-009`,`RQ-WMLS-010`],testingAc:[`Load the example and press Enter on "Run WAP-193 operators"; activeCardId should stay home.`,`Confirm runtime-state lastScriptExecutionOk becomes true.`,`Confirm runtime-state lastScriptExecutionTrap remains (none).`,`Select "Reject invalid WAP-193 script", confirm the fatal/integrity stack-underflow outcome, then run the valid script again to prove host recovery.`],flows:[{id:`script-link-success-and-navigation-continuity`,title:`A verified operator/conversion script succeeds without disrupting navigation`,target:`host-sample`,workItems:[`W0-01`,`W0-03`,`W1-04`,`WMLS-501`,`WMLS-502`],specItems:[`RQ-WMLS-001`,`RQ-WMLS-004`,`RQ-WMLS-005`,`RQ-WMLS-006`,`RQ-WMLS-008`,`RQ-WMLS-009`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,lastScriptExecutionOk:null,lastScriptExecutionTrap:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,lastScriptExecutionOk:!0,lastScriptExecutionTrap:null},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`done`,focusedLinkIndex:0},traceKinds:[`SCRIPT_OK`,`ACTION_FRAGMENT`]}}]},{id:`verifier-failure-and-recovery`,title:`A fatal verifier failure is stable and a replacement invocation recovers`,target:`host-sample`,workItems:[`WMLS-501`,`W1-02`],specItems:[`RQ-WMLS-008`,`RQ-WMLS-009`,`RQ-WMLS-010`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,lastScriptExecutionOk:null,lastScriptExecutionTrap:null}},steps:[{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:2}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:2,lastScriptExecutionOk:!1,lastScriptExecutionTrap:`wap decode: stack underflow in function 0 at pc=0 (required=1, available=0)`},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_TRAP`],statusIncludes:`stack underflow`}},{action:{type:`key`,key:`up`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`up`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,lastScriptExecutionOk:!0,lastScriptExecutionTrap:null},traceKinds:[`SCRIPT_TRAP`,`ACTION_SCRIPT`,`SCRIPT_OK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      Script action execution demo.
      <a href="script:wap-193-operator-conversions.wmlsc#main">Run WAP-193 operators</a>
      <br/>
      <a href="#done">Continue</a>
      <br/>
      <a href="script:wap-193-stack-underflow.wmlsc#main">Reject invalid WAP-193 script</a>
    </p>
  </card>
  <card id="done">
    <p>Script executed in previous card. <a href="#home">Back</a></p>
  </card>
</wml>
`},{key:`timerHostClockLifecycle`,label:`Timer Host Clock Lifecycle`,description:"Demonstrates host-driven deterministic timer ticking for non-zero `<timer value>` expiry.",goal:`Verify auto tick advances runtime clock and ontimer dispatch transitions cards without manual key input.`,workItems:[`A5-03`],specItems:[`WML-R-014`],testingAc:[`Select this example and press Enter on "Start timed card".`,`Enable Auto Tick with 100ms step and wait until the card transitions.`,`Confirm activeCardId transitions from timed to done and trace contains TIMER_TICK, TIMER_EXPIRE, and ACTION_ONTIMER.`],flows:[{id:`nonzero-timer-host-clock-expiry`,title:`A nonzero timer advances through host ticks and expires once`,target:`host-sample`,workItems:[`A5-03`],specItems:[`WML-R-014`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0},traceKinds:[`ACTION_FRAGMENT`,`TIMER_START`]}},{action:{type:`tick`,ms:1e3},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0},traceKinds:[`TIMER_START`,`TIMER_TICK`]}},{action:{type:`tick`,ms:100},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0}}},{action:{type:`tick`,ms:100},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0}}},{action:{type:`tick`,ms:100},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0}}},{action:{type:`tick`,ms:100},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0}}},{action:{type:`tick`,ms:100},expect:{state:{activeCardId:`done`,focusedLinkIndex:0},traceKinds:[`TIMER_TICK`,`TIMER_EXPIRE`,`ACTION_ONTIMER`,`ACTION_FRAGMENT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p><a href="#timed">Start timed card</a></p>
  </card>
  <card id="timed">
    <onevent type="ontimer"><go href="#done"/></onevent>
    <timer value="15"/>
    <p>Auto tick should move this card after 1.5 seconds.</p>
  </card>
  <card id="done">
    <p>Timer completed through host clock lifecycle.</p>
  </card>
</wml>
`},{key:`timerOntimerImmediate`,label:`Timer Zero Disabled`,description:'Demonstrates that `<timer value="0"/>` disables ontimer dispatch at card-entry boundaries.',goal:`Verify a zero timer remains inactive and publishes no host wakeup.`,workItems:[`WML-305`],specItems:[`WML-CL-TIMER-INVALID-VALUE`],testingAc:[`Press Enter on "To timed" from home.`,`Confirm activeCardId remains timed after a deterministic one-second tick.`,`Confirm trace includes TIMER_IGNORE and does not include ACTION_ONTIMER.`],flows:[{id:`zero-timer-disabled`,title:`Zero-value timer disables ontimer dispatch`,target:`host-sample`,workItems:[`WML-305`],specItems:[`WML-CL-TIMER-INVALID-VALUE`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`ACTION_FRAGMENT`,`TIMER_IGNORE`]}},{action:{type:`tick`,ms:1e3},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0,externalNavigationIntent:null}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p><a href="#timed">To timed</a></p>
  </card>
  <card id="timed">
    <onevent type="ontimer"><go href="#next"/></onevent>
    <timer value="0"/>
    <p>Zero timer remains disabled.</p>
  </card>
  <card id="next">
    <p>Reached via ontimer dispatch.</p>
  </card>
</wml>
`},{key:`timerScriptDialog`,label:`Timer Script Dialog`,description:`Demonstrates a runtime-owned WML timer invoking a WaveScript alert host capability at expiry.`,goal:`Verify timer expiry dispatches ontimer, invokes the script, and publishes the dialog request in deterministic order.`,workItems:[`W0-05`],specItems:[`RQ-WMLS-022`],testingAc:[`Press Enter on "Start timer" to enter the timed card.`,`Advance the deterministic runtime clock by 1000ms.`,`Confirm the trace orders TIMER_EXPIRE, ACTION_ONTIMER, ACTION_SCRIPT, DIALOG_ALERT, and SCRIPT_OK.`,`Confirm the dialog request is published only after the script invocation boundary.`],flows:[{id:`timer-expiry-script-dialog-order`,title:`Timer expiry invokes script and publishes dialog capability in order`,target:`host-sample`,workItems:[`W0-05`],specItems:[`RQ-WMLS-022`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null,lastScriptDialogRequests:[]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0,externalNavigationIntent:null,lastScriptDialogRequests:[]},traceKinds:[`ACTION_FRAGMENT`,`TIMER_START`]}},{action:{type:`tick`,ms:1e3},expect:{state:{activeCardId:`timed`,focusedLinkIndex:0,externalNavigationIntent:null,lastScriptDialogRequests:[{type:`alert`,message:`Timer expired`}]},traceKinds:[`TIMER_TICK`,`TIMER_EXPIRE`,`ACTION_ONTIMER`,`ACTION_SCRIPT`,`DIALOG_ALERT`,`SCRIPT_OK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p><a href="#timed">Start timer</a></p>
  </card>
  <card id="timed">
    <onevent type="ontimer">
      <go href="script:timer-dialog.wmlsc#showExpiryAlert"/>
    </onevent>
    <timer value="10"/>
    <p>Waiting for the runtime timer.</p>
  </card>
</wml>
`},{key:`wavescriptGoCancel`,label:`WaveScript Go Cancel`,description:`Exercises go-cancel behavior where go("") clears pending navigation intent in the same invocation.`,goal:`Verify deferred navigation cancellation semantics are deterministic.`,workItems:[`W0-04`],specItems:[`RQ-WMLS-018`],testingAc:[`On home card, press Enter on "Script go then cancel".`,`Confirm activeCardId remains home after invocation.`,`Confirm runtime-state externalNavigationIntent remains (none).`],flows:[{id:`script-go-cancel-clears-pending-navigation`,title:`Script go followed by cancel leaves navigation unchanged`,target:`host-sample`,workItems:[`W0-04`],specItems:[`RQ-WMLS-018`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null,lastScriptExecutionOk:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null,lastScriptExecutionOk:!0,lastScriptExecutionTrap:null},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      go("#next") then go("") in one script invocation.
      <a href="script:wavescript-fixtures.wmlsc#goCancel">Script go then cancel</a>
    </p>
  </card>
  <card id="next">
    <p>If you can read this from the script link, cancellation regressed. <a href="#home">Back</a></p>
  </card>
</wml>
`},{key:`wavescriptNavOrder`,label:`WaveScript Navigation Order`,description:`Demonstrates last-call-wins behavior for go/prev ordering inside a single script invocation.`,goal:`Confirm ordering rules stay deterministic as compatibility fixtures evolve.`,workItems:[`W0-04`],specItems:[`RQ-WMLS-018`],testingAc:[`Press Enter on "go then prev" and confirm activeCardId stays home.`,`Press Down then Enter on "prev then go" and confirm activeCardId becomes next.`,`On next card, press Enter on "Script external go" and confirm externalNavigationIntent is populated.`],flows:[{id:`script-navigation-order-and-external-outcome`,title:`Script navigation is last-call-wins for cancel, fragment, and external outcomes`,target:`host-sample`,workItems:[`W0-04`],specItems:[`RQ-WMLS-018`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null,lastScriptExecutionOk:!0},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0,externalNavigationIntent:null,lastScriptExecutionOk:!0},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0,externalNavigationIntent:`http://local.test/next.wml?from=script`,lastScriptExecutionOk:!0},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      Navigation ordering matrix.
      <a href="script:wavescript-fixtures.wmlsc#goThenPrev">go then prev</a>
      <br/>
      <a href="script:wavescript-fixtures.wmlsc#prevThenGo">prev then go</a>
    </p>
  </card>
  <card id="next">
    <p>
      Reached via prev-then-go ordering.
      <a href="script:wavescript-fixtures.wmlsc#externalGo">Script external go</a>
      <br/>
      <a href="#home">Back home</a>
    </p>
  </card>
</wml>
`},{key:`wavescriptRefreshPolicy`,label:`WaveScript Refresh Policy`,description:`Verifies setVar-driven refresh signaling without navigation side effects.`,goal:`Confirm requiresRefresh policy is surfaced while active card remains stable.`,workItems:[`W0-04`],specItems:[`RQ-WMLS-017`,`RQ-WMLS-021`],testingAc:[`On home card, press Enter on "Script setVar only".`,`Confirm activeCardId remains home and focusedLinkIndex remains stable.`,`Confirm runtime-state nextCardVar becomes updated and lastScriptRequiresRefresh becomes true.`],flows:[{id:`script-refresh-without-navigation`,title:`Script variable mutation requests refresh without navigation`,target:`host-sample`,workItems:[`W0-04`],specItems:[`RQ-WMLS-017`,`RQ-WMLS-021`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,nextCardVar:null,externalNavigationIntent:null,lastScriptRequiresRefresh:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,nextCardVar:`updated`,externalNavigationIntent:null,lastScriptExecutionOk:!0,lastScriptRequiresRefresh:!0},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      Refresh policy demo (no navigation).
      <a href="script:wavescript-fixtures.wmlsc#refreshOnly">Script setVar only</a>
    </p>
  </card>
</wml>
`},{key:`wml202TemplateShadowing`,label:`WML Deck Metadata, Card Context, and Template Task Shadowing`,description:`Root language plus ordered deck access/meta data coexist with a deck-level accept binding that is inherited, overridden, and then masked by a newcontext card binding with the same effective name.`,goal:`Verify a stable deck/head/access/meta/language parse path plus deterministic template inheritance, card precedence, inactive noop masking, and go-only newcontext history clearing.`,workItems:[`R0-04`,`R0-12`,`C5-03`,`WML-202`],specItems:[`WML-C-08`,`WML-C-21`,`WML-C-30`,`WML-C-34`,`WML-C-47`,`WML-C-53`],testingAc:[`Load the example; its ordered head access/meta model is accepted without changing the first-card render.`,`Load the example and activate Enter on inherited; the unshadowed template binding navigates to override.`,`Activate Enter on override; the same-named card binding replaces the template task and navigates to masked.`,`Activate Enter on masked; the card-level noop masks both bindings and produces no task action.`,`Navigate Back from masked; newcontext has cleared the prior card history, so masked remains active.`],flows:[{id:`template-inherit-override-and-noop-mask`,title:`Template accept inheritance yields to card override and noop mask`,target:`host-sample`,workItems:[`R0-04`,`R0-12`,`C5-03`,`WML-202`],specItems:[`WML-C-08`,`WML-C-21`,`WML-C-30`,`WML-C-34`,`WML-C-47`,`WML-C-53`],initial:{state:{activeCardId:`inherited`,focusedLinkIndex:0,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`override`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`,`ACTION_ACCEPT`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`masked`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`,`ACTION_ACCEPT`,`ACTION_FRAGMENT`,`KEY`,`ACTION_ACCEPT`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`masked`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`,`ACTION_ACCEPT`,`ACTION_FRAGMENT`,`KEY`,`ACTION_ACCEPT`,`ACTION_FRAGMENT`,`KEY`]}},{action:{type:`back`},expect:{state:{activeCardId:`masked`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`NEWCONTEXT`,`ACTION_BACK_EMPTY`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml xml:lang="en">
  <head>
    <meta name="scenario" content="wml-202" scheme="work-item"/>
    <access domain="example.test" path="/examples"/>
    <meta http-equiv="Cache-Control" content="max-age=60" forua="true"/>
  </head>
  <template>
    <do type="accept" name="primary" label="Deck next">
      <go href="#override"/>
    </do>
  </template>
  <card id="inherited">
    <p>The template accept task is active on this card.</p>
  </card>
  <card id="override" xml:lang="fr" ordered="false">
    <do type="accept" name="primary" label="Card next">
      <go href="#masked"/>
    </do>
    <p>The card accept task shadows the template task.</p>
  </card>
  <card id="masked" newcontext="true">
    <do type="accept" name="primary">
      <noop/>
    </do>
    <p>The same-named noop masks both accept tasks.</p>
  </card>
</wml>
`},{key:`wml203DtdFamily`,label:`WML 1.3 Selected DTD Family`,description:`Canonical WML 1.3 text exercising every selected DTD element family through the strict engine boundary.`,goal:`Verify mandatory prologue handling and deterministic parsing/rendering across the selected WML 1.3 document family.`,workItems:[`WML-203`],specItems:[`WML-CL-PROLOGUE-REQUIRED`,`WML-CL-WML-ROOT-STRUCTURE`,`WML-CL-CARD-STRUCTURE`,`WML-CL-CARD-CONTENT-ORDER`,`WML-CL-DO-STRUCTURE`,`WML-CL-ONEVENT-SINGLE-TASK`,`WML-CL-GO-STRUCTURE`,`WML-CL-SELECT-STRUCTURE`,`WML-CL-TABLE-STRUCTURE`],testingAc:[`Load the example and confirm the main card renders representative text, table, and option content without a parser error.`,`Move focus once and confirm the active card and rendered family content remain deterministic.`],flows:[{id:`strict-selected-dtd-family-render`,title:`Strict WML 1.3 prologue and selected DTD family render deterministically`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`WML-203`],specItems:[`WML-CL-PROLOGUE-REQUIRED`,`WML-CL-WML-ROOT-STRUCTURE`,`WML-CL-CARD-STRUCTURE`,`WML-CL-CARD-CONTENT-ORDER`,`WML-CL-DO-STRUCTURE`,`WML-CL-ONEVENT-SINGLE-TASK`,`WML-CL-GO-STRUCTURE`,`WML-CL-SELECT-STRUCTURE`,`WML-CL-TABLE-STRUCTURE`],initial:{state:{activeCardId:`main`,focusedLinkIndex:0,externalNavigationIntent:null},render:{textIncludes:[`Family`,`Cell`,`One`,`Pre`]}},steps:[{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`main`,focusedLinkIndex:1,externalNavigationIntent:null},traceKinds:[`KEY`],render:{textIncludes:[`Family`,`Cell`,`One`,`Pre`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml id="family" xml:lang="en">
  <head>
    <access domain="example.test" path="/apps"/>
    <meta name="scenario" content="wml-203"/>
  </head>
  <template>
    <do type="options" name="template-options"><noop/></do>
    <onevent type="onenterbackward"><noop/></onevent>
  </template>
  <card id="main" title="WML family" newcontext="false" ordered="true">
    <onevent type="onenterforward"><noop/></onevent>
    <timer name="clock" value="10"/>
    <do type="accept" name="submit">
      <go href="#next" method="post">
        <postfield name="q" value="x"/>
        <setvar name="q" value="x"/>
      </go>
    </do>
    <p align="left" mode="wrap">
      Family <em>em <strong>strong <b>bold <i>italic <u>under
      <big>big <small>small</small></big></u></i></b></strong></em><br/>
      <img alt="diagram" src="diagram.png" align="bottom"/>
      <anchor title="refresh">Refresh<refresh><setvar name="q" value="y"/></refresh></anchor>
      <a href="#next">Next</a>
      <table columns="1"><tr><td>Cell</td></tr></table>
      <input name="field" type="text"/>
      <select name="choice">
        <optgroup title="Group">
          <option value="1">One<onevent type="onpick"><noop/></onevent></option>
        </optgroup>
      </select>
      <fieldset title="More"><input name="extra"/></fieldset>
    </p>
    <pre xml:space="preserve">Pre <anchor>Back<prev/></anchor><do type="reset" name="reset"><noop/></do></pre>
  </card>
  <card id="next"><p>Done</p></card>
</wml>
`},{key:`wml203WbxmlParity`,label:`WML 1.3 WBXML Structural Parity`,description:`Canonical WML 1.3 text matching the transport decoder's binary-basic-deck output.`,goal:`Verify the text-only engine ingests and renders the same canonical deck model as the reconstructed binary WBXML transport path.`,workItems:[`WML-203`],specItems:[`WBXML-C-001`,`WBXML-C-010`,`WBXML-C-011`,`WML-C-17`],testingAc:[`Load the example and confirm the main card renders Hello without a parser error.`],flows:[{id:`canonical-doctype-deck-render`,title:`Canonical WML 1.3 text matches reconstructed WBXML engine rendering`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`WML-203`],specItems:[`WBXML-C-001`,`WBXML-C-010`,`WBXML-C-011`,`WML-C-17`],initial:{state:{activeCardId:`main`,focusedLinkIndex:0,externalNavigationIntent:null},render:{textIncludes:[`Hello`]}},steps:[{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`main`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`],render:{textIncludes:[`Hello`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="main" newcontext="false" ordered="true">
    <p align="left">Hello</p>
  </card>
</wml>
`},{key:`wml204ControlValidation`,label:`WML 1.3 Control Validation`,description:`Source-valid WML fieldset, input, select, and option controls with declared attributes exercised by the strict parser.`,goal:`Verify the simulator accepts the declared grouped-control grammar, processes fieldset children, and renders deterministic text, password, and single-select controls.`,workItems:[`B5-01`,`R0-04`,`WML-204`],specItems:[`WML-C-33`,`WML-C-41`,`WML-C-43`],testingAc:[`Load the example and confirm the fieldset's User, PIN, and Country controls render without a parser error.`,`Focus the PIN field, clear it, enter alphabetic text, and confirm the mask rejects the commit while preserving the retry draft.`,`Correct the PIN to one through four digits, commit it, and confirm its rendered value remains visually masked.`,`Follow Verify PIN variable and confirm the committed password value initializes the proof field through vdata without being lost.`,`Confirm escaped literal dollars and undefined variables are evaluated deterministically in the proof controls.`,`Focus Country, move to France, press Enter, and confirm the committed option is rendered.`],flows:[{id:`waves-input-rejection-retry-and-password-state`,title:`Waves rejects invalid input atomically and preserves committed password state`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`B5-01`,`R0-04`,`WML-204`],specItems:[`WML-C-33`,`WML-C-41`,`WML-C-43`],initial:{state:{activeCardId:`controls`,focusedLinkIndex:0,focusedInputEditName:null},render:{textIncludes:[`AHMED`,`****`,`Verify PIN variable`,`Jordan`]}},steps:[{action:{type:`key`,key:`down`},expect:{state:{focusedLinkIndex:1,focusedInputEditName:null}}},{action:{type:`type-text`,text:`x`},expect:{state:{focusedLinkIndex:1,focusedInputEditName:`Pin`,focusedInputEditValue:`1234`},traceKinds:[`INPUT_EDIT_START`]}},{action:{type:`keyboard`,key:`Backspace`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:`123`}}},{action:{type:`keyboard`,key:`Backspace`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:`12`}}},{action:{type:`keyboard`,key:`Backspace`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:`1`}}},{action:{type:`keyboard`,key:`Backspace`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:``}}},{action:{type:`type-text`,text:`ab`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:`ab`},render:{textIncludes:[`**`]}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:`ab`},traceKinds:[`INPUT_EDIT_START`,`INPUT_EDIT_REJECT`],statusIncludes:`value does not conform to format mask`}},{action:{type:`keyboard`,key:`Backspace`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:`a`}}},{action:{type:`keyboard`,key:`Backspace`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:``}}},{action:{type:`type-text`,text:`987`},expect:{state:{focusedInputEditName:`Pin`,focusedInputEditValue:`987`},render:{textIncludes:[`***`]}}},{action:{type:`keyboard`,key:`Enter`},expect:{state:{focusedInputEditName:null,focusedInputEditValue:null},traceKinds:[`INPUT_EDIT_START`,`INPUT_EDIT_REJECT`,`INPUT_EDIT_COMMIT`],render:{textIncludes:[`***`]}}},{action:{type:`key`,key:`down`},expect:{state:{focusedLinkIndex:2}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`proof`,focusedLinkIndex:0},render:{textIncludes:[`Committed PIN:`,`PinProof: 987`,`DollarProof: $987`,`MissingProof: prepost`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="controls" title="WML Controls">
    <do type="accept"><noop/></do>
    <p>
      <fieldset title="Account controls">
        User:
        <input
          name="UserName"
          title="User name"
          type="text"
          value="AHMED"
          size="12"
          maxlength="24"
          tabindex="1"
          accesskey="1"
        />
        <br/>
        PIN:
        <input
          name="Pin"
          title="Numeric PIN"
          type="password"
          value="1234"
          format="4N"
          emptyok="false"
          size="4"
          maxlength="4"
          tabindex="2"
          accesskey="2"
        />
        <br/>
        <a href="#proof">Verify PIN variable</a>
        <br/>
        Country:
        <select
          name="Country"
          title="Country"
          multiple="false"
          iname="CountryIndex"
          ivalue="1"
          tabindex="3"
        >
          <option value="Jordan" title="Jordan">Jordan</option>
          <option value="France" title="France">France</option>
          <option value="Germany" title="Germany">Germany</option>
        </select>
      </fieldset>
    </p>
  </card>
  <card id="proof" title="PIN Variable Proof">
    <p>Committed PIN:</p>
    <p><input name="PinProof" value="$(Pin)" format="4N"/></p>
    <p><input name="DollarProof" value="$$$(Pin)"/></p>
    <p><input name="MissingProof" value="pre$(Missing)post"/></p>
  </card>
</wml>
`},{key:`wml204SelectSemantics`,label:`WML 1.3 Select Semantics`,description:`Source-derived nested optgroup traversal, single-select initialization, and user-commit behavior with name and iname variables.`,goal:`Verify that ignored optgroup hierarchy still processes options in document order, ivalue preselection initializes both result variables, and a committed user choice updates them deterministically.`,workItems:[`R0-04`,`C5-05`,`WML-204`],specItems:[`WML-C-41`,`WML-C-43`],testingAc:[`Load the example and confirm nested optgroup children are processed and France is initially selected from ivalue 2.`,`Confirm nextCard is initialized to France and nextCardIndex is initialized to 2.`,`Confirm the following input initializes from nextCard, proving select-before-input document order.`,`Begin select editing, move once to Germany, and confirm the draft does not change the committed variable.`,`Commit Germany and confirm its vdata value remains raw while its onpick HREF escapes reserved characters.`],flows:[{id:`initialization-and-user-commit`,title:`Select initialization and committed user state stay deterministic`,target:`host-sample`,workItems:[`R0-04`,`C5-05`,`WML-204`],specItems:[`WML-C-41`,`WML-C-43`],initial:{state:{activeCardId:`select-semantics`,focusedLinkIndex:0,nextCardVar:`France`,externalNavigationIntent:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`select-semantics`,focusedLinkIndex:0,nextCardVar:`France`},traceKinds:[`SELECT_EDIT_START`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`select-semantics`,focusedLinkIndex:0,nextCardVar:`France`}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`select-semantics`,focusedLinkIndex:0,nextCardVar:`A B/C?D=E&F`,externalNavigationIntent:`http://local.test/choose/A%20B%2FC%3FD%3DE%26F`},traceKinds:[`SELECT_EDIT_START`,`SELECT_EDIT_COMMIT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="select-semantics" title="Select Semantics">
    <p>
      Destination:
      <select
        name="nextCard"
        iname="nextCardIndex"
        ivalue="2"
        title="Destination"
      >
        <optgroup title="Destinations">
          <option value="Jordan">Jordan</option>
          <optgroup title="Europe">
            <option value="France">France</option>
            <option value="$(route)" onpick="/choose/$(route)">Germany</option>
          </optgroup>
        </optgroup>
      </select>
      <input name="selectionProof" value="$(nextCard)"/>
      <input name="route" value="A B/C?D=E&amp;F"/>
    </p>
  </card>
</wml>
`},{key:`wml205ErrorRecovery`,label:`WML 1.3 Deterministic Error Recovery`,description:`Alternate-DTD extensions recover deterministically, while failed external fetch and access-control tasks preserve the invoking card and pending intent.`,goal:`Verify recoverable content remains navigable and host task failures are visible without partially committing a deck transition.`,workItems:[`WML-205`],specItems:[`WML-C-16`,`WML-C-17`,`WML-C-18`,`WML-C-29`],testingAc:[`Load the example and confirm recognized content nested in the vendor wrapper remains visible.`,`Confirm supported metadata coexists with the recovered vendor extension.`,`Activate Recovery proof and confirm deterministic navigation reaches the proof card.`,`Activate Missing target in network mode and confirm the fetch failure is reported while the invoking card, render, and pending intent remain unchanged.`,`Activate Restricted target in network mode and confirm access denial is reported while the invoking card, render, and pending intent remain unchanged.`],flows:[{id:`alternate-dtd-content-recovery`,title:`Alternate-DTD extension content recovers without losing navigation`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`WML-205`],specItems:[`WML-C-16`,`WML-C-17`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null},render:{textIncludes:[`Before extension.`,`Recovered extension content.`,`After extension.`]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`proof`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`Recovered content stayed deterministic and navigable.`]}}}]},{id:`fetch-failure-preserves-invoking-task-state`,title:`A failed external fetch notifies the user without committing task state`,target:`waves-browser`,setup:{runMode:`network`},workItems:[`WML-205`],specItems:[`WML-C-16`,`WML-C-18`,`WML-C-29`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null},session:{runMode:`network`,navigationStatus:`loaded`,finalUrl:`http://fixtures.test/examples/wml205ErrorRecovery.wml`},render:{textIncludes:[`Recovered extension content.`,`Missing target`]}},steps:[{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1,externalNavigationIntent:null},traceKinds:[`KEY`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1,externalNavigationIntent:`http://fixtures.test/examples/wml205MissingTarget.wml`},traceKinds:[`KEY`,`ACTION_EXTERNAL`],session:{navigationStatus:`error`,finalUrl:`http://fixtures.test/examples/wml205ErrorRecovery.wml`},statusIncludes:`Fetch failed:`,render:{textIncludes:[`Recovered extension content.`,`Missing target`]}}}]},{id:`access-denial-preserves-invoking-task-state`,title:`Destination access denial notifies the user without committing task state`,target:`waves-browser`,setup:{runMode:`network`},workItems:[`WML-205`],specItems:[`WML-C-16`,`WML-C-18`,`WML-C-29`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null},session:{runMode:`network`,navigationStatus:`loaded`,finalUrl:`http://fixtures.test/examples/wml205ErrorRecovery.wml`},render:{textIncludes:[`Recovered extension content.`,`Restricted target`]}},steps:[{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1,externalNavigationIntent:null}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:2,externalNavigationIntent:null},traceKinds:[`KEY`,`KEY`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:2,externalNavigationIntent:`http://fixtures.test/examples/wml202TemplateShadowing.wml`},traceKinds:[`KEY`,`ACTION_EXTERNAL`],session:{navigationStatus:`error`,finalUrl:`http://fixtures.test/examples/wml205ErrorRecovery.wml`},statusIncludes:`Deck parse failed: Deck access denied for referring URI`,render:{textIncludes:[`Recovered extension content.`,`Restricted target`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//VENDOR//DTD WML 1.3 PLUS//EN"
  "http://vendor.test/wml13-plus.dtd">
<wml>
  <head>
    <meta name="vendor-mode" content="training"/>
  </head>
  <card id="home">
    <p>
      Before extension.
      <vendor:panel data-mode="compact">
        Recovered extension content.
        <a href="#proof">Recovery proof</a>
        <a href="http://fixtures.test/examples/wml205MissingTarget.wml">Missing target</a>
        <a href="http://fixtures.test/examples/wml202TemplateShadowing.wml">Restricted target</a>
      </vendor:panel>
      After extension.
    </p>
  </card>
  <card id="proof">
    <p>Recovered content stayed deterministic and navigable.</p>
  </card>
</wml>
`},{key:`wml301CardTableBoundaries`,label:`WML-301 Card and Table Boundaries`,description:`Exercises leading, middle, trailing, and adjacent tables across fragment navigation and BACK.`,goal:`Verify WML 1.3 source-required card/table line boundaries without disturbing card order or history.`,workItems:[`WML-301`],specItems:[`WML-CL-CARD-TABLE-BOUNDARIES`,`WML-CL-CARD-CONTENT-ORDER`,`WML-CL-CARD-ID-FRAGMENT`,`WML-CL-NAVIGATION-REFERENCE-MODEL`],testingAc:[`Confirm a middle table has distinct content lines before and after it.`,`Confirm leading and trailing tables do not receive an extra outer boundary at the card edge.`,`Navigate through the table cards and use BACK to confirm the prior card is restored.`],flows:[{id:`card-table-boundaries-and-cross-card-navigation`,title:`Card table boundaries remain stable across fragment navigation`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`WML-301`],specItems:[`WML-CL-CARD-TABLE-BOUNDARIES`,`WML-CL-CARD-CONTENT-ORDER`,`WML-CL-CARD-ID-FRAGMENT`,`WML-CL-NAVIGATION-REFERENCE-MODEL`],initial:{state:{activeCardId:`middle`,focusedLinkIndex:0,externalNavigationIntent:null},render:{textIncludes:[`Before`,`Middle table`,`After`,`Leading case`]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`leading`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`Leading table`,`After leading`,`Trailing case`]}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`trailing`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`Before trailing`,`Trailing table`]}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`adjacent`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`First table`,`Second table`]}}},{action:{type:`back`},expect:{state:{activeCardId:`trailing`,focusedLinkIndex:0},render:{textIncludes:[`Before trailing`,`Trailing table`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN" "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="middle">
    <p>
      Before
      <table columns="1"><tr><td>Middle table</td></tr></table>
      After
      <a href="#leading">Leading case</a>
    </p>
  </card>
  <card id="leading">
    <p>
      <table columns="1"><tr><td>Leading table</td></tr></table>
      After leading
      <a href="#trailing">Trailing case</a>
    </p>
  </card>
  <card id="trailing">
    <do type="accept" label="Adjacent"><go href="#adjacent"/></do>
    <p>
      Before trailing
      <table columns="1"><tr><td>Trailing table</td></tr></table>
    </p>
  </card>
  <card id="adjacent">
    <p>
      <table columns="1"><tr><td>First table</td></tr></table>
      <table columns="1"><tr><td>Second table</td></tr></table>
    </p>
  </card>
</wml>
`},{key:`wml301ContextHistoryFresh`,label:`WML-301 Fresh Context Target`,description:`Supporting newcontext destination for the WML-301 executable network story.`,goal:`Demonstrate that destination newcontext clears variables and prior navigation history.`,workItems:[`WML-301`],specItems:[`WML-CL-CARD-CONTEXT-ATTRIBUTE`,`WML-CL-CONTEXT-SINGLE-SCOPE`,`WML-CL-CONTEXT-STATE-MEMBERS`,`WML-CL-GO-HISTORY-PUSH`],testingAc:[`Loaded by the WML-301 context/history story as a deterministic supporting resource.`],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="fresh" newcontext="true">
    <p>Fresh context value: $(contextValue).</p>
  </card>
</wml>
`},{key:`wml301ContextHistoryTarget`,label:`WML-301 Context and History Target`,description:`Supporting destination deck for the WML-301 executable network story.`,goal:`Expose preserved context after forward entry across a deck boundary.`,workItems:[`WML-301`],specItems:[`WML-CL-CONTEXT-STATE-MEMBERS`,`WML-CL-GO-HISTORY-PUSH`,`WML-CL-HISTORY-DUPLICATE-PUSH`,`WML-CL-NAVIGATION-REFERENCE-MODEL`],testingAc:[`Loaded by the WML-301 context/history story as a deterministic supporting resource.`],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="fallback">
    <p>Fragment fallback card.</p>
  </card>
  <card id="target">
    <onevent type="onenterforward">
      <refresh><setvar name="entryDirection" value="forward"/></refresh>
    </onevent>
    <p>
      Target context: $(contextValue). Entry: $(entryDirection).
    </p>
  </card>
</wml>
`},{key:`wml301ContextHistory`,label:`WML-301 Context and History`,description:`Repeats the active card, crosses a deck boundary, restores both duplicate entries, and enters a newcontext destination.`,goal:`Verify browser-context preservation/reset, fragment selection, duplicate history pushes, and forward/back process order.`,workItems:[`WML-301`],specItems:[`WML-CL-CARD-CONTEXT-ATTRIBUTE`,`WML-CL-CARD-ID-FRAGMENT`,`WML-CL-CONTEXT-SINGLE-SCOPE`,`WML-CL-CONTEXT-STATE-MEMBERS`,`WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT`,`WML-CL-GO-FRAGMENT-FALLBACK`,`WML-CL-GO-HISTORY-PUSH`,`WML-CL-HISTORY-DUPLICATE-PUSH`,`WML-CL-HISTORY-STACK-MODEL`,`WML-CL-NAVIGATION-REFERENCE-MODEL`],testingAc:[`Follow the same-card link, then enter a second deck and confirm the source context variable is visible after onenterforward processing.`,`Press Back twice and confirm both request-shaped source entries are restored in order across the deck boundary.`,`Follow the newcontext link and confirm the variable and previous history are cleared.`],flows:[{id:`cross-deck-context-duplicate-history-and-reset`,title:`Cross-deck context survives forward/back traversal and newcontext resets history`,target:`waves-browser`,setup:{runMode:`network`},workItems:[`WML-301`],specItems:[`WML-CL-CARD-CONTEXT-ATTRIBUTE`,`WML-CL-CARD-ID-FRAGMENT`,`WML-CL-CONTEXT-SINGLE-SCOPE`,`WML-CL-CONTEXT-STATE-MEMBERS`,`WML-CL-EXTERNAL-NAVIGATION-NEW-CONTEXT`,`WML-CL-GO-FRAGMENT-FALLBACK`,`WML-CL-GO-HISTORY-PUSH`,`WML-CL-HISTORY-DUPLICATE-PUSH`,`WML-CL-HISTORY-STACK-MODEL`,`WML-CL-NAVIGATION-REFERENCE-MODEL`],initial:{state:{activeCardId:`source`,focusedLinkIndex:0,externalNavigationIntent:null},session:{runMode:`network`,navigationStatus:`loaded`,finalUrl:`http://fixtures.test/examples/wml301ContextHistory.wml`}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`source`,focusedLinkIndex:0},traceKinds:[`ACTION_FRAGMENT`],session:{finalUrl:`http://fixtures.test/examples/wml301ContextHistory.wml`}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`source`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`target`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`ACTION_EXTERNAL`,`LOAD_DECK`,`ACTION_REFRESH`],session:{finalUrl:`http://fixtures.test/examples/wml301ContextHistoryTarget.wml`},render:{textIncludes:[`Target context: kept. Entry: forward.`]}}},{action:{type:`back`},expect:{state:{activeCardId:`source`,focusedLinkIndex:0},session:{finalUrl:`http://fixtures.test/examples/wml301ContextHistory.wml`}}},{action:{type:`back`},expect:{state:{activeCardId:`source`,focusedLinkIndex:0},session:{finalUrl:`http://fixtures.test/examples/wml301ContextHistory.wml`}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`source`,focusedLinkIndex:1}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`source`,focusedLinkIndex:2}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`fresh`,focusedLinkIndex:0},session:{finalUrl:`http://fixtures.test/examples/wml301ContextHistoryFresh.wml`},render:{textIncludes:[`Fresh context value: .`]}}},{action:{type:`back`},expect:{state:{activeCardId:`fresh`,focusedLinkIndex:0},statusIncludes:`no back history`}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="source">
    <onevent type="onenterforward">
      <refresh><setvar name="contextValue" value="kept"/></refresh>
    </onevent>
    <p>
      <a href="#source">Repeat source card</a>
      <a href="wml301ContextHistoryTarget.wml#target">Open target</a>
      <a href="wml301ContextHistoryFresh.wml#fresh">Reset context</a>
    </p>
  </card>
</wml>
`},{key:`wml302VariableSubstitution`,label:`WML-302 Variable Store and Substitution`,description:`Exercises task-snapshot setvars, literal-dollar handling, text and HREF substitution, context persistence, and prev assignment order.`,goal:`Verify that WML variables are resolved from stable task snapshots and remain engine-owned across render and navigation.`,workItems:[`WML-302`],specItems:[`WML-C-07`,`WML-C-12`,`WML-C-18`,`WML-C-29`,`WML-C-38`,`WML-C-52`,`RQ-RMK-002`,`RQ-RMK-003`,`RQ-RMK-005`],testingAc:[`Press Enter on home; the go task snapshots all setvars, reaches display, and renders the substituted greeting plus literal and undefined-dollar cases.`,`Follow the substituted link target to final; the same browser context preserves the greeting.`,`Press Back on final; the WML prev task applies Return before restoring display.`],flows:[{id:`host-variable-snapshot-substitution-and-prev`,title:`Host sample preserves WML variable snapshot and prev ordering`,target:`host-sample`,workItems:[`WML-302`],specItems:[`WML-C-07`,`WML-C-12`,`WML-C-18`,`WML-C-29`,`WML-C-38`,`WML-C-52`,`RQ-RMK-002`,`RQ-RMK-003`,`RQ-RMK-005`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`display`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_ACCEPT`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`final`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`display`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK_OVERRIDE`,`ACTION_PREV`,`ACTION_BACK`]}}]},{id:`waves-variable-snapshot-substitution-and-prev`,title:`Waves preserves WML variable snapshot and prev ordering`,target:`waves-browser`,workItems:[`WML-302`],specItems:[`WML-C-07`,`WML-C-12`,`WML-C-18`,`WML-C-29`,`WML-C-38`,`WML-C-52`,`RQ-RMK-002`,`RQ-RMK-003`,`RQ-RMK-005`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0},render:{textIncludes:[`Press Enter to snapshot variables.`]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`display`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_ACCEPT`,`ACTION_FRAGMENT`],render:{textIncludes:[`Greeting: A B.`,`Dollar: $.`,`Undefined: prepost.`,`Open final`]}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`final`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`Variables persisted: A B.`]}}},{action:{type:`back`},expect:{state:{activeCardId:`display`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK_OVERRIDE`,`ACTION_PREV`,`ACTION_BACK`],render:{textIncludes:[`Return: back.`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <do type="accept">
      <go href="#display">
        <setvar name="Greeting" value="A B"/>
        <setvar name="Route" value="final"/>
        <setvar name="First" value="new"/>
        <setvar name="Copied" value="$(First)"/>
      </go>
    </do>
    <p>Press Enter to snapshot variables.</p>
  </card>

  <card id="display">
    <p>
      Greeting: $(Greeting:noesc).
      Dollar: $$.
      Undefined: pre$(Missing)post.
      Snapshot: pre$(Copied)post.
      Return: $(Return).
      <a href="#$(Route)">Open $(Route:noesc)</a>
    </p>
  </card>

  <card id="final">
    <do type="prev">
      <prev><setvar name="Return" value="back"/></prev>
    </do>
    <p>Variables persisted: $(Greeting:noesc).</p>
  </card>
</wml>
`},{key:`wml303ActionsSoftkeys`,label:`WML-303 Actions and Softkey Precedence`,description:`Exercises deterministic BACK activation across optional, card, template, and noop-masked do bindings.`,goal:`Verify WML-owned action identity and precedence before the host falls back to intrinsic history.`,workItems:[`WML-303`],specItems:[`WML-C-08`,`WML-C-18`,`WML-C-26`,`WML-C-35`,`WML-C-38`,`WML-C-47`,`RQ-WAE-017`],testingAc:[`Follow First precedence and press Back; the first active card do type prev reaches card-wins.`,`Follow Noop mask and press Back; the card noop masks the matching template do and intrinsic history returns home.`,`Run both paths through the host sample and Waves browser story targets.`],flows:[{id:`host-card-first-prev-precedence`,title:`Host sample BACK uses the first active card prev binding`,target:`host-sample`,workItems:[`WML-303`],specItems:[`WML-C-08`,`WML-C-18`,`WML-C-26`,`WML-C-38`,`WML-C-47`,`RQ-WAE-017`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`ordered`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`card-wins`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK_OVERRIDE`,`ACTION_FRAGMENT`]}}]},{id:`host-noop-mask-falls-back-to-history`,title:`Host sample noop mask suppresses template prev before intrinsic BACK`,target:`host-sample`,workItems:[`WML-303`],specItems:[`WML-C-08`,`WML-C-18`,`WML-C-35`,`WML-C-38`,`WML-C-47`,`RQ-WAE-017`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`masked`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`]}}]},{id:`waves-card-first-prev-precedence`,title:`Waves BACK uses the engine-selected first active card prev binding`,target:`waves-browser`,workItems:[`WML-303`],specItems:[`WML-C-08`,`WML-C-18`,`WML-C-26`,`WML-C-38`,`WML-C-47`,`RQ-WAE-017`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`ordered`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`card-wins`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK_OVERRIDE`,`ACTION_FRAGMENT`]}}]},{id:`waves-noop-mask-falls-back-to-history`,title:`Waves BACK honors noop masking before intrinsic history`,target:`waves-browser`,workItems:[`WML-303`],specItems:[`WML-C-08`,`WML-C-18`,`WML-C-35`,`WML-C-38`,`WML-C-47`,`RQ-WAE-017`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`masked`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <template>
    <do name="back" type="prev" label="Template back">
      <go href="#template-wins"/>
    </do>
  </template>

  <card id="home">
    <p>
      WML action precedence.
      <a href="#ordered">First precedence</a>
      <a href="#masked">Noop mask</a>
    </p>
  </card>

  <card id="ordered">
    <do name="optional-prev" type="prev" label="Optional" optional="true">
      <go href="#optional-wins"/>
    </do>
    <do name="card-first" type="prev" label="Card back">
      <go href="#card-wins"/>
    </do>
    <do name="card-second" type="prev" label="Second card back">
      <go href="#second-wins"/>
    </do>
    <p>Back resolves the first active card binding.</p>
  </card>

  <card id="masked">
    <do name="back" type="prev"><noop/></do>
    <p>Back ignores the masked template action and pops history.</p>
  </card>

  <card id="card-wins"><p>First card BACK binding won.</p></card>
  <card id="second-wins"><p>The second card binding must not win.</p></card>
  <card id="template-wins"><p>The template binding must not win.</p></card>
  <card id="optional-wins"><p>The optional binding must not be presented.</p></card>
</wml>
`},{key:`wml304RequestIntent`,label:`WML-304 Request Intent Contract`,description:`Captures the bounded WML go request intent without performing network fetch or transport serialization.`,goal:`Verify method, ordered postfields, referer opt-in, no-cache, enctype, charset, and same-deck classification at the engine boundary.`,workItems:[`WML-304`],specItems:[`WML-CL-HISTORY-POST-REPLAY`,`WML-CL-POSTFIELD-STRUCTURE`,`WML-CL-POSTFIELD-REQUEST-PAIR`,`WML-CL-GO-STRUCTURE`,`WML-CL-GO-INTERNAL-POSTFIELD-SUPPRESSION`,`WML-CL-GO-REFERER`,`WML-CL-GO-METHOD`,`WML-CL-GO-NO-CACHE`,`WML-CL-GO-ENCTYPE-SUPPORT`,`WML-CL-GO-PART-CONTENT-TYPE`,`WML-CL-GO-ACCEPT-CHARSET`,`WML-CL-GO-SUBMISSION-ORDER`,`WML-CL-GO-GET-QUERY-MERGE`,`WML-CL-GO-POST-CONTENT-TYPE-CHARSET`,`WML-CL-GO-FORM-URLENCODING`],testingAc:[`Activate Submit and inspect the ordered POST request intent emitted by the engine.`,`Confirm sendreferer, no-cache, enctype, accept-charset, and same-deck values are serialized identically for native and WASM hosts.`,`Confirm the transport fixture independently covers GET query merge, both POST encodings, and typed POST history replay without moving serialization into the engine.`],flows:[{id:`host-wml-304-request-intent`,title:`Host sample captures the bounded ordered WML go request intent`,target:`host-sample`,workItems:[`WML-304`],specItems:[`WML-CL-HISTORY-POST-REPLAY`,`WML-CL-POSTFIELD-STRUCTURE`,`WML-CL-POSTFIELD-REQUEST-PAIR`,`WML-CL-GO-STRUCTURE`,`WML-CL-GO-INTERNAL-POSTFIELD-SUPPRESSION`,`WML-CL-GO-REFERER`,`WML-CL-GO-METHOD`,`WML-CL-GO-NO-CACHE`,`WML-CL-GO-ENCTYPE-SUPPORT`,`WML-CL-GO-PART-CONTENT-TYPE`,`WML-CL-GO-ACCEPT-CHARSET`,`WML-CL-GO-SUBMISSION-ORDER`,`WML-CL-GO-GET-QUERY-MERGE`,`WML-CL-GO-POST-CONTENT-TYPE-CHARSET`,`WML-CL-GO-FORM-URLENCODING`],initial:{state:{activeCardId:`home`,externalNavigationIntent:null,externalNavigationRequestPolicy:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,externalNavigationIntent:`http://local.test/submit`,externalNavigationRequestPolicy:{cacheControl:`no-cache`,refererUrl:`http://local.test/deck.wml`,postContext:{sameDeck:!1,contentType:`application/x-www-form-urlencoded`,payload:`first=one&second=two`},requestIntent:{method:`post`,enctype:`application/x-www-form-urlencoded`,sendReferer:!0,acceptCharset:`utf-8`,sameDeck:!1,postFields:[{name:`first`,value:`one`},{name:`second`,value:`two`}]}}},traceKinds:[`KEY`,`ACTION_ACCEPT`,`ACTION_EXTERNAL`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <do type="accept" label="Submit">
      <go href="/submit" method="post" sendreferer="true"
          cache-control="no-cache" accept-charset="utf-8">
        <postfield name="first" value="one"/>
        <postfield name="second" value="two"/>
      </go>
    </do>
    <p>Activate Submit to capture the WML request intent.</p>
  </card>
</wml>
`},{key:`wml305TimerLifecycle`,label:`WML-305 Native Timer Lifecycle`,description:`Exercises named WML timer initialization, refresh resume, exit persistence, expiry, and host wakeup boundaries.`,goal:`Verify native timer semantics stay deterministic through the production WASM host and Waves browser adapters.`,workItems:[`WML-305`],specItems:[`WML-CL-GO-TIMER-THEN-DISPLAY`,`WML-CL-REFRESH-TIMER-RESTART`,`WML-CL-TIMER-EVENT-TRANSITION`,`WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE`,`WML-CL-TIMER-NAME-PERSISTENCE`,`WML-CL-TIMER-REFRESH-RESUME`,`WML-CL-TIMER-START-STOP`,`WML-CL-TIMER-UNITS`],testingAc:[`Run the refresh path and confirm the timer restarts from the refresh assignment before expiring at zero.`,`Run the exit path and confirm the current timer value is persisted in tenths on the destination card.`,`Confirm host snapshots expose the exact remaining native-timer wakeup delay.`],flows:[{id:`host-refresh-resume-and-expire`,title:`Host sample refreshes a named timer and dispatches at one-to-zero`,target:`host-sample`,workItems:[`WML-305`],specItems:[`WML-CL-GO-TIMER-THEN-DISPLAY`,`WML-CL-REFRESH-TIMER-RESTART`,`WML-CL-TIMER-EVENT-TRANSITION`,`WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE`,`WML-CL-TIMER-NAME-PERSISTENCE`,`WML-CL-TIMER-REFRESH-RESUME`,`WML-CL-TIMER-START-STOP`,`WML-CL-TIMER-UNITS`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`refresh-timer`,focusedLinkIndex:0,nextTimerWakeupMs:500},traceKinds:[`ACTION_FRAGMENT`,`TIMER_START`]}},{action:{type:`tick`,ms:100},expect:{state:{activeCardId:`refresh-timer`,nextTimerWakeupMs:400},traceKinds:[`TIMER_TICK`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`refresh-timer`,nextTimerWakeupMs:200},traceKinds:[`ACTION_REFRESH`,`TIMER_PERSIST`,`TIMER_STOP`,`TIMER_START`]}},{action:{type:`tick`,ms:100},expect:{state:{activeCardId:`refresh-timer`,nextTimerWakeupMs:100}}},{action:{type:`tick`,ms:100},expect:{state:{activeCardId:`expired`},traceKinds:[`TIMER_TICK`,`TIMER_PERSIST`,`TIMER_EXPIRE`,`ACTION_ONTIMER`,`ACTION_FRAGMENT`]}}]},{id:`waves-refresh-resume-and-expire`,title:`Waves refreshes a named timer through deterministic host wakeups`,target:`waves-browser`,workItems:[`WML-305`],specItems:[`WML-CL-GO-TIMER-THEN-DISPLAY`,`WML-CL-REFRESH-TIMER-RESTART`,`WML-CL-TIMER-EVENT-TRANSITION`,`WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE`,`WML-CL-TIMER-NAME-PERSISTENCE`,`WML-CL-TIMER-REFRESH-RESUME`,`WML-CL-TIMER-START-STOP`,`WML-CL-TIMER-UNITS`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`refresh-timer`,nextTimerWakeupMs:500},traceKinds:[`ACTION_FRAGMENT`,`TIMER_START`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`refresh-timer`,nextTimerWakeupMs:200},traceKinds:[`ACTION_REFRESH`,`TIMER_PERSIST`,`TIMER_STOP`,`TIMER_START`]}},{action:{type:`key`,key:`up`},expect:{state:{activeCardId:`expired`},traceKinds:[`TIMER_EXPIRE`,`ACTION_ONTIMER`,`ACTION_FRAGMENT`],render:{textIncludes:[`Expired at 0.`]}}}]},{id:`waves-exit-persists-current-value`,title:`Waves persists a named timer when its card exits`,target:`waves-browser`,workItems:[`WML-305`],specItems:[`WML-CL-GO-TIMER-THEN-DISPLAY`,`WML-CL-TIMER-INITIAL-VALUE-PRECEDENCE`,`WML-CL-TIMER-NAME-PERSISTENCE`,`WML-CL-TIMER-START-STOP`,`WML-CL-TIMER-UNITS`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`down`},expect:{state:{focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`exit-timer`,nextTimerWakeupMs:500},traceKinds:[`ACTION_FRAGMENT`,`TIMER_START`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`persisted`},traceKinds:[`ACTION_FRAGMENT`,`TIMER_PERSIST`,`TIMER_STOP`],render:{textIncludes:[`Persisted timer value: 5.`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      WML timer lifecycle.
      <a href="#refresh-timer">Refresh lifecycle</a>
      <a href="#exit-timer">Exit persistence</a>
    </p>
  </card>

  <card id="refresh-timer">
    <onevent type="ontimer"><go href="#expired"/></onevent>
    <timer name="remaining" value="5"/>
    <do type="accept" label="Refresh timer">
      <refresh><setvar name="remaining" value="2"/></refresh>
    </do>
    <p>Press Enter after one tick to refresh the timer.</p>
  </card>

  <card id="exit-timer">
    <timer name="saved" value="5"/>
    <p><a href="#persisted">Leave timer card</a></p>
  </card>

  <card id="expired"><p>Expired at $(remaining).</p></card>
  <card id="persisted"><p>Persisted timer value: $(saved).</p></card>
</wml>
`},{key:`wml306PolicyRecovery`,label:`WML 1.3 Access and Failure Policy`,description:`Exercises alternate-DTD recovery and a failed task that must remain atomic while the host presents bounded error copy.`,goal:`Verify recognized content remains usable and a missing fragment cannot partially mutate or navigate the invoking card.`,workItems:[`WML-306`],specItems:[`WML-C-14`,`WML-C-16`,`WML-C-17`,`WML-C-21`],testingAc:[`Load the example and confirm the recognized text nested in the vendor wrapper remains visible.`,`Activate Failure policy and confirm the failure-policy card becomes active.`,`Press Select again and confirm the card remains active while the host reports only the safe task-failure message.`],flows:[{id:`unknown-dtd-and-atomic-task-failure`,title:`Unknown DTD content recovers and failed tasks expose bounded host copy`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`WML-306`],specItems:[`WML-C-14`,`WML-C-16`,`WML-C-17`,`WML-C-21`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,externalNavigationIntent:null},render:{textIncludes:[`Before vendor policy.`,`Recognized content remains available.`,`After vendor policy.`]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`failure`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`Failed actions keep this card active.`]}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`failure`,focusedLinkIndex:0,externalNavigationIntent:null},traceKinds:[`ACTION_ACCEPT`,`ACTION_FRAGMENT`],statusIncludes:`The requested page action could not be completed.`,render:{textIncludes:[`Failed actions keep this card active.`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//VENDOR//DTD WML 1.3 POLICY//EN"
  "http://vendor.test/wml13-policy.dtd">
<wml>
  <card id="home">
    <p>
      Before vendor policy.
      <vendor:policy mode="constrained">
        Recognized content remains available.
        <a href="#failure">Failure policy</a>
      </vendor:policy>
      After vendor policy.
    </p>
  </card>
  <card id="failure">
    <do type="accept">
      <go href="#missing">
        <setvar name="PrivateState" value="must-roll-back"/>
      </go>
    </do>
    <p>Failed actions keep this card active.</p>
  </card>
</wml>
`},{key:`wml309FrameAffordances`,label:`WML-309 Frame Affordances`,description:`Exercises the canonical engine presentation frame for ordered active do affordances and frame-bound action dispatch.`,goal:`Verify that active do elements are exposed once with stable action identifiers and best-effort labels while optional and noop-masked actions stay absent.`,workItems:[`WML-309`,`WBP-06`,`F0-01`],specItems:[`WML-C-26`,`RQ-RMK-002`,`WML-CL-DO-ACTIVE-VISIBILITY`,`WML-CL-DO-LABEL-BEST-EFFORT`,`WML-CL-DO-UNIQUE-WIDGET`],testingAc:[`The initial frame exposes Open Ada, the accept fallback label, and template Help Ada in deterministic order.`,`The first accept action is the logical primary control and later actions remain task affordances.`,`Activating do:alternate through the current frame identifier reaches the second card.`,`Optional and noop-masked do elements never appear as affordances.`],flows:[{id:`host-frame-affordance-contract`,title:`Host sample consumes ordered frame affordances and activates one by stable id`,target:`host-sample`,workItems:[`WML-309`,`WBP-06`,`F0-01`],specItems:[`WML-C-26`,`RQ-RMK-002`,`WML-CL-DO-ACTIVE-VISIBILITY`,`WML-CL-DO-LABEL-BEST-EFFORT`,`WML-CL-DO-UNIQUE-WIDGET`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0},frame:{contractVersion:3,profileId:`class-c-reference`,cardId:`home`,affordances:[{actionId:`do:open`,label:`Open Ada`,source:`card-do`,control:`primary`,enabled:!0},{actionId:`do:alternate`,label:`accept`,source:`card-do`,control:`task`,enabled:!0},{actionId:`do:template-help`,label:`Help Ada`,source:`template-do`,control:`task`,enabled:!0}]}},steps:[{action:{type:`activate-action`,actionId:`do:alternate`},expect:{state:{activeCardId:`second`,focusedLinkIndex:0},traceKinds:[`ACTION_AFFORDANCE`,`ACTION_FRAGMENT`],frame:{contractVersion:3,profileId:`class-c-reference`,cardId:`second`,affordances:[{actionId:`do:template-help`,label:`Help Ada`,source:`template-do`,control:`task`,enabled:!0},{actionId:`do:masked`,label:`options`,source:`template-do`,control:`task`,enabled:!0},{actionId:`history:back`,label:`Back`,source:`history`,control:`back`,enabled:!0}]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <template>
    <do name="template-help" type="help" label="Help Ada"><go href="#help"/></do>
    <do name="masked" type="options"><go href="#masked"/></do>
  </template>

  <card id="home">
    <do name="open" type="accept" label="Open Ada"><go href="#first"/></do>
    <do name="alternate" type="accept"><go href="#second"/></do>
    <do name="masked" type="options"><noop/></do>
    <do name="optional" type="x-vendor" optional="true"><go href="#optional"/></do>
    <p>Choose an action.</p>
  </card>

  <card id="first"><p>First action.</p></card>
  <card id="second"><p>Second action.</p></card>
  <card id="help"><p>Help action.</p></card>
  <card id="masked"><p>Masked action.</p></card>
  <card id="optional"><p>Optional action.</p></card>
</wml>
`},{key:`wmlbrowserContextFidelity`,label:`WMLBrowser Context Fidelity`,description:`Exercises getCurrentCard and newContext semantics, including context reset side effects and prev suppression.`,goal:`Validate that current-card lookup and newContext resets align with WMLScript context semantics in host-visible flows.`,workItems:[`R0-03`,`W0-07`],specItems:[`RQ-WMLS-019`,`RQ-WMLS-020`],testingAc:[`On home card, press Enter on "Read current card into nextCard" and confirm runtime-state nextCardVar becomes #home.`,`Follow "Go to next card" then activate "Run newContext + prev"; activeCardId should remain next and nextCardVar should clear.`,`Press browser Back after newContext and verify history is cleared for prior card context (no return to home via engine history).`],flows:[{id:`current-card-and-context-reset`,title:`Current-card lookup and newContext clear variables and history`,target:`host-sample`,workItems:[`R0-03`,`W0-07`],specItems:[`RQ-WMLS-019`,`RQ-WMLS-020`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,nextCardVar:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,nextCardVar:`#home`,lastScriptExecutionOk:!0},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`home`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0,nextCardVar:null,lastScriptExecutionOk:!0},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}},{action:{type:`back`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0,nextCardVar:null},traceKinds:[`ACTION_BACK_EMPTY`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`next`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:1,nextCardVar:`#next`,lastScriptExecutionOk:!0},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      WMLBrowser context semantics demo.
      <a href="script:wmlbrowser-demo.wmlsc#readCurrentCard">Read current card into nextCard</a>
      <a href="#next">Go to next card</a>
    </p>
  </card>
  <card id="next">
    <p>
      newContext should clear vars/history and ignore prev in same script.
      <a href="script:wmlbrowser-demo.wmlsc#newContextPrev">Run newContext + prev</a>
      <a href="script:wmlbrowser-demo.wmlsc#readCurrentCard">Read current card into nextCard</a>
    </p>
  </card>
</wml>
`},{key:`wmlbrowserVarNav`,label:`WMLBrowser Var + Nav`,description:`Exercises script-host bindings for setVar/getVar and deferred go/prev navigation effects.`,goal:`Validate WMLBrowser subset semantics at the engine-owned post-invocation boundary.`,workItems:[`W0-04`],specItems:[`RQ-WMLS-017`,`RQ-WMLS-018`],testingAc:[`On home card, press Enter on "Script setVar + go"; activeCardId should become next.`,`Confirm runtime-state nextCardVar becomes #next after the script runs.`,`On next card, press Enter on "Script prev"; activeCardId should return to home.`],flows:[{id:`variable-fragment-and-prev-effects`,title:`WMLBrowser variable, go, and prev effects apply after script invocation`,target:`host-sample`,workItems:[`W0-04`],specItems:[`RQ-WMLS-017`,`RQ-WMLS-018`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0,nextCardVar:null}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0,nextCardVar:`#next`,lastScriptExecutionOk:!0},traceKinds:[`ACTION_SCRIPT`,`SCRIPT_OK`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0,nextCardVar:`#next`,lastScriptExecutionOk:!0},traceKinds:[`ACTION_SCRIPT`,`ACTION_BACK`,`SCRIPT_OK`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>WMLBrowser var/nav subset demo. <a href="script:wmlbrowser-demo.wmlsc#main">Script setVar + go</a></p>
  </card>
  <card id="next">
    <p>Navigation came from script go(). <a href="script:wmlbrowser-demo.wmlsc#back">Script prev</a></p>
  </card>
</wml>
`},{key:`wrapStress`,label:`Long Token Wrap`,description:`Long unbroken token fixture for deterministic wrapping checks.`,goal:`Detect layout regressions in char-width wrapping and ensure navigation remains usable.`,workItems:[`A3-01`,`RSL-04`],specItems:[`WML-R-004`],testingAc:[`Load the deck and confirm the long token wraps consistently in the canvas viewport.`,`Confirm bounded legacy and presentation output render together without duplicate layout work.`,`Reload the same deck multiple times and verify visual wrapping does not drift.`,`Press Enter on "Continue" and confirm activeCardId transitions to next.`,`Press Enter on "Back" and confirm return to home.`],flows:[{id:`long-token-navigation-stays-usable`,title:`Long unbroken token wraps and navigation remains usable`,target:`host-sample`,workItems:[`A3-01`,`RSL-04`],specItems:[`WML-R-004`],initial:{state:{activeCardId:`home`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`home`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="home">
    <p>
      supercalifragilisticpseudopneumonoultramicroscopicsilicovolcanoconiosis
      <a href="#next">Continue</a>
    </p>
  </card>
  <card id="next">
    <p>Wrap test complete. <a href="#home">Back</a></p>
  </card>
</wml>
`},{key:`yourFirstDeck`,label:`Your First Deck`,description:`Guided first-run tutorial deck teaching the Up/Down/Select/Back softkey controls.`,goal:`Verify a newcomer can move focus, select a link, and use Back to return through engine card history using only the four softkey controls.`,workItems:[`WBP-04`],specItems:[`WBP-04`],testingAc:[`Press Select on "Select this link to continue"; activeCardId should become next.`,`Press Down then Up; focus should move to the second link then back to the first.`,`Press Down then Select; activeCardId should become detail-two.`,`Press Back; activeCardId should return to next.`,`Press Select on "First option"; activeCardId should become detail-one.`],flows:[{id:`keypad-softkey-tour`,title:`Up/Down/Select/Back softkeys move focus, navigate, and pop history`,target:`host-sample`,workItems:[`WBP-04`],specItems:[`WBP-04`],initial:{state:{activeCardId:`start`,focusedLinkIndex:0}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`next`,focusedLinkIndex:1}}},{action:{type:`key`,key:`up`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`next`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`detail-two`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}},{action:{type:`back`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`detail-one`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`]}}]},{id:`waves-keypad-softkey-tour`,title:`Waves UI drives the softkey tour through the ordinary engine path`,target:`waves-browser`,setup:{runMode:`local`},workItems:[`WBP-04`],specItems:[`WBP-04`],initial:{state:{activeCardId:`start`,focusedLinkIndex:0},session:{runMode:`local`,navigationStatus:`loaded`},render:{textIncludes:[`Welcome to Waves.`,`Select this link to continue`]}},steps:[{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`Nice work. You selected a link.`,`First option`,`Second option`]}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`next`,focusedLinkIndex:1}}},{action:{type:`key`,key:`up`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0}}},{action:{type:`key`,key:`down`},expect:{state:{activeCardId:`next`,focusedLinkIndex:1}}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`detail-two`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`Now try Back to return through history.`]}}},{action:{type:`back`},expect:{state:{activeCardId:`next`,focusedLinkIndex:0},traceKinds:[`ACTION_BACK`]}},{action:{type:`key`,key:`enter`},expect:{state:{activeCardId:`detail-one`,focusedLinkIndex:0},traceKinds:[`KEY`,`ACTION_FRAGMENT`],render:{textIncludes:[`You selected the first option.`]}}}]}],wml:`<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.3//EN"
  "http://www.wapforum.org/DTD/wml13.dtd">
<wml>
  <card id="start">
    <p>Welcome to Waves.</p>
    <p>Up and Down move focus between links. Select activates the focused link.</p>
    <p><a href="#next">Select this link to continue</a></p>
  </card>
  <card id="next">
    <p>Nice work. You selected a link.</p>
    <p>Try Down, then Select, to open the second option.</p>
    <p>
      <a href="#detail-one">First option</a>
      <a href="#detail-two">Second option</a>
    </p>
  </card>
  <card id="detail-one">
    <p>You selected the first option. <a href="#next">Back to options</a></p>
  </card>
  <card id="detail-two">
    <p>You moved focus with Down, then selected the second option.</p>
    <p>Now try Back to return through history.</p>
    <p><a href="#next">Back to options</a></p>
  </card>
</wml>
`}];function pe(e){return e===`ArrowUp`?`up`:e===`ArrowDown`?`down`:e===`Enter`?`enter`:null}function me(e){let t=!1,n=()=>{e.container.classList.toggle(e.collapsedClass,t),e.toggleButton.textContent=t?`Expand`:`Collapse`,e.toggleButton.setAttribute(`aria-expanded`,String(!t))};return{apply:n,toggle:()=>{t=!t,n()}}}function he(e,t){e.textContent=[`activeCardId: ${t.activeCardId}`,`focusedLinkIndex: ${t.focusedLinkIndex}`,`baseUrl: ${t.baseUrl}`,`contentType: ${t.contentType}`,`nextCardVar: ${t.nextCardVar??`(none)`}`,`externalNavigationIntent: ${t.externalNavigationIntent??`(none)`}`,`lastScriptExecutionOk: ${t.lastScriptExecutionOk??`(none)`}`,`lastScriptExecutionTrap: ${t.lastScriptExecutionTrap??`(none)`}`,`lastScriptExecutionErrorClass: ${t.lastScriptExecutionErrorClass??`(none)`}`,`lastScriptExecutionErrorCategory: ${t.lastScriptExecutionErrorCategory??`(none)`}`,`lastScriptRequiresRefresh: ${t.lastScriptRequiresRefresh??`(none)`}`].join(`
`)}var ge=class{logs=new Map;sequence=1;activeExampleKey;output;constructor(e,t){this.output=e,this.activeExampleKey=t}setActiveExample(e){this.activeExampleKey=e,this.renderActive()}append(e,t){let n=new Date().toLocaleTimeString(`en-CA`,{hour12:!1}),r=t?`activeCardId=${t.activeCardId} focus=${t.focusedLinkIndex} intent=${t.externalNavigationIntent??`(none)`}`:``,i=`${String(this.sequence).padStart(4,`0`)} ${n} | ${e}${r?` | ${r}`:``}`;this.sequence+=1;let a=this.logs.get(this.activeExampleKey)??[];a.push(i),this.logs.set(this.activeExampleKey,a),this.output.textContent=a.join(`
`)}clearActive(){this.logs.set(this.activeExampleKey,[]),this.renderActive()}renderActive(){let e=this.logs.get(this.activeExampleKey)??[];this.output.textContent=e.length>0?e.join(`
`):`No events yet for this example.`}exportActive(e){let t=this.logs.get(this.activeExampleKey)??[];if(t.length===0)return null;let n=new Date().toISOString();return e===`json`?{filename:`wavenav-event-log-${this.activeExampleKey}.json`,mimeType:`application/json;charset=utf-8`,payload:JSON.stringify({exampleKey:this.activeExampleKey,exportedAt:n,events:t},null,2)}:{filename:`wavenav-event-log-${this.activeExampleKey}.txt`,mimeType:`text/plain;charset=utf-8`,payload:[`exampleKey: ${this.activeExampleKey}`,`exportedAt: ${n}`,``,...t].join(`
`)}}};function _e(e,t){let n=[...t.workItems,...t.specItems];e.title.textContent=`${t.label} (${t.key})`,e.coverage.textContent=`Coverage: ${n.join(`, `)}`,e.description.textContent=`Description: ${t.description}`,e.goal.textContent=`Goal: ${t.goal}`,e.testingAc.replaceChildren();for(let n of t.testingAc){let t=document.createElement(`li`);t.textContent=n,e.testingAc.appendChild(t)}}function ve(e){let t=new Blob([e.payload],{type:e.mimeType}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=e.filename,document.body.appendChild(r),r.click(),r.remove(),URL.revokeObjectURL(n)}var N=globalThis,ye=N.ShadowRoot&&(N.ShadyCSS===void 0||N.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,be=Symbol(),xe=new WeakMap,P=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==be)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(ye&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=xe.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&xe.set(t,e))}return e}toString(){return this.cssText}},F=e=>new P(typeof e==`string`?e:e+``,void 0,be),I=(e,...t)=>new P(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,be),Se=(e,t)=>{if(ye)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=N.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},L=ye?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return F(t)})(e):e,{is:R,defineProperty:z,getOwnPropertyDescriptor:B,getOwnPropertyNames:V,getOwnPropertySymbols:H,getPrototypeOf:Ce}=Object,U=globalThis,we=U.trustedTypes,Te=we?we.emptyScript:``,Ee=U.reactiveElementPolyfillSupport,W=(e,t)=>e,De={toAttribute(e,t){switch(t){case Boolean:e=e?Te:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},Oe=(e,t)=>!R(e,t),ke={attribute:!0,type:String,converter:De,reflect:!1,useDefault:!1,hasChanged:Oe};Symbol.metadata??=Symbol(`metadata`),U.litPropertyMetadata??=new WeakMap;var G=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ke){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&z(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=B(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ke}static _$Ei(){if(this.hasOwnProperty(W(`elementProperties`)))return;let e=Ce(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(W(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(W(`properties`))){let e=this.properties,t=[...V(e),...H(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(L(e))}else e!==void 0&&t.push(L(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Se(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?De:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?De:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??Oe)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};G.elementStyles=[],G.shadowRootOptions={mode:`open`},G[W(`elementProperties`)]=new Map,G[W(`finalized`)]=new Map,Ee?.({ReactiveElement:G}),(U.reactiveElementVersions??=[]).push(`2.1.2`);var Ae=globalThis,je=e=>e,Me=Ae.trustedTypes,Ne=Me?Me.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,Pe=`$lit$`,K=`lit$${Math.random().toFixed(9).slice(2)}$`,Fe=`?`+K,Ie=`<${Fe}>`,q=document,Le=()=>q.createComment(``),Re=e=>e===null||typeof e!=`object`&&typeof e!=`function`,ze=Array.isArray,Be=e=>ze(e)||typeof e?.[Symbol.iterator]==`function`,Ve=`[ 	
\f\r]`,He=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ue=/-->/g,We=/>/g,J=RegExp(`>|${Ve}(?:([^\\s"'>=/]+)(${Ve}*=${Ve}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),Ge=/'/g,Ke=/"/g,qe=/^(?:script|style|textarea|title)$/i,Je=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),Y=Symbol.for(`lit-noChange`),X=Symbol.for(`lit-nothing`),Ye=new WeakMap,Z=q.createTreeWalker(q,129);function Xe(e,t){if(!ze(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return Ne===void 0?t:Ne.createHTML(t)}var Ze=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=He;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===He?c[1]===`!--`?o=Ue:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=J):(qe.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=J):o=We:o===J?c[0]===`>`?(o=i??He,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?J:c[3]===`"`?Ke:Ge):o===Ke||o===Ge?o=J:o===Ue||o===We?o=He:(o=J,i=void 0);let d=o===J&&e[t+1].startsWith(`/>`)?` `:``;a+=o===He?n+Ie:l>=0?(r.push(s),n.slice(0,l)+Pe+n.slice(l)+K+d):n+K+(l===-2?t:d)}return[Xe(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},Qe=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=Ze(t,n);if(this.el=e.createElement(l,r),Z.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=Z.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(Pe)){let t=u[o++],n=i.getAttribute(e).split(K),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?nt:r[1]===`?`?rt:r[1]===`@`?it:tt}),i.removeAttribute(e)}else e.startsWith(K)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(qe.test(i.tagName)){let e=i.textContent.split(K),t=e.length-1;if(t>0){i.textContent=Me?Me.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],Le()),Z.nextNode(),c.push({type:2,index:++a});i.append(e[t],Le())}}}else if(i.nodeType===8){if(i.data===Fe)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(K,e+1))!==-1;)c.push({type:7,index:a}),e+=K.length-1}}a++}}static createElement(e,t){let n=q.createElement(`template`);return n.innerHTML=e,n}};function Q(e,t,n=e,r){if(t===Y)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=Re(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=Q(e,i._$AS(e,t.values),i,r)),t}var $e=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??q).importNode(t,!0);Z.currentNode=r;let i=Z.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new et(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new at(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=Z.nextNode(),a++)}return Z.currentNode=q,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},et=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=X,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Q(this,e,t),Re(e)?e===X||e==null||e===``?(this._$AH!==X&&this._$AR(),this._$AH=X):e!==this._$AH&&e!==Y&&this._(e):e._$litType$===void 0?e.nodeType===void 0?Be(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==X&&Re(this._$AH)?this._$AA.nextSibling.data=e:this.T(q.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=Qe.createElement(Xe(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new $e(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Ye.get(e.strings);return t===void 0&&Ye.set(e.strings,t=new Qe(e)),t}k(t){ze(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(Le()),this.O(Le()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=je(e).nextSibling;je(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},tt=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=X,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=X}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=Q(this,e,t,0),a=!Re(e)||e!==this._$AH&&e!==Y,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=Q(this,r[n+o],t,o),s===Y&&(s=this._$AH[o]),a||=!Re(s)||s!==this._$AH[o],s===X?e=X:e!==X&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===X?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},nt=class extends tt{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===X?void 0:e}},rt=class extends tt{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==X)}},it=class extends tt{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=Q(this,e,t,0)??X)===Y)return;let n=this._$AH,r=e===X&&n!==X||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==X&&(n===X||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},at=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){Q(this,e)}},ot=Ae.litHtmlPolyfillSupport;ot?.(Qe,et),(Ae.litHtmlVersions??=[]).push(`3.3.2`);var st=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new et(t.insertBefore(Le(),e),e,void 0,n??{})}return i._$AI(e),i},ct=globalThis,$=class extends G{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=st(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return Y}};$._$litElement$=!0,$.finalized=!0,ct.litElementHydrateSupport?.({LitElement:$});var lt=ct.litElementPolyfillSupport;lt?.({LitElement:$}),(ct.litElementVersions??=[]).push(`4.2.2`);var ut=class extends ${static properties={entries:{attribute:!1},exportFormat:{state:!0},kindFilter:{state:!0},cardFilter:{state:!0},trapsOnly:{state:!0}};static styles=I`
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
  `;constructor(){super(),this.entries=[],this.exportFormat=`txt`,this.kindFilter=``,this.cardFilter=``,this.trapsOnly=!1}render(){let e=this.getFilteredEntries(),t=e.length===0?`No engine trace entries yet.`:e.map(e=>{let t=e.active_card_id??`(none)`,n=e.external_navigation_intent??`(none)`,r=typeof e.script_ok==`boolean`?String(e.script_ok):`(none)`,i=e.script_trap??`(none)`;return`${e.seq.toString().padStart(4,`0`)} ${e.kind} detail="${e.detail}" card=${t} focus=${e.focused_link_index} intent=${n} scriptOk=${r} trap=${i}`}).join(`
`);return Je`
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
    `}getFilteredEntries(){let e=this.kindFilter.trim().toLowerCase(),t=this.cardFilter.trim().toLowerCase();return this.entries.filter(n=>{if(this.trapsOnly&&!n.script_trap||e&&!n.kind.toLowerCase().includes(e))return!1;let r=n.active_card_id??``;return!(t&&!r.toLowerCase().includes(t))})}onClearClicked=()=>{this.dispatchEvent(new CustomEvent(`trace-clear-requested`))};onExportFormatChanged=e=>{let t=e.target;this.exportFormat=t.value===`json`?`json`:`txt`};onExportClicked=()=>{let e=this.getFilteredEntries(),t=this.exportFormat;if(e.length===0){this.dispatchEvent(new CustomEvent(`trace-exported`,{detail:{outcome:`empty`,format:t,count:0}}));return}let n=new Date().toISOString();ve(t===`json`?{filename:`wavenav-engine-trace.json`,mimeType:`application/json`,payload:JSON.stringify({exportedAt:n,entries:e},null,2)}:{filename:`wavenav-engine-trace.txt`,mimeType:`text/plain`,payload:[`exportedAt: ${n}`,`entryCount: ${e.length}`,``,...e.map(e=>{let t=e.active_card_id??`(none)`,n=e.external_navigation_intent??`(none)`,r=typeof e.script_ok==`boolean`?String(e.script_ok):`(none)`,i=e.script_trap??`(none)`;return`${e.seq.toString().padStart(4,`0`)} ${e.kind} detail="${e.detail}" card=${t} focus=${e.focused_link_index} intent=${n} scriptOk=${r} trap=${i}`})].join(`
`)}),this.dispatchEvent(new CustomEvent(`trace-exported`,{detail:{outcome:`exported`,format:t,count:e.length}}))};applyPreset(e){e===`all`?(this.kindFilter=``,this.cardFilter=``,this.trapsOnly=!1):e===`scripts`?(this.kindFilter=`ACTION_SCRIPT`,this.cardFilter=``,this.trapsOnly=!1):e===`navigation`?(this.kindFilter=`ACTION_`,this.cardFilter=``,this.trapsOnly=!1):(this.kindFilter=``,this.cardFilter=``,this.trapsOnly=!0),this.dispatchEvent(new CustomEvent(`trace-preset-applied`,{detail:{preset:e}}))}onKindFilterChanged=e=>{let t=e.target;this.kindFilter=t.value};onCardFilterChanged=e=>{let t=e.target;this.cardFilter=t.value};onTrapsOnlyChanged=e=>{let t=e.target;this.trapsOnly=t.checked}};customElements.define(`runtime-inspector-panel`,ut);var dt=250,ft=100,pt=new Set([100,250,500,1e3]);async function mt(){let e=document.querySelector(`#wap-screen`),t=document.querySelector(`#deck-input`),n=document.querySelector(`#reload-deck`),r=document.querySelector(`#example-select`),i=document.querySelector(`.editor-wrap`),a=document.querySelector(`#toggle-editor`),o=document.querySelector(`#live-reload`),s=document.querySelector(`#press-back`),c=document.querySelector(`#press-up`),l=document.querySelector(`#press-down`),u=document.querySelector(`#press-enter`),d=document.querySelector(`#tick-100ms`),f=document.querySelector(`#tick-1s`),p=document.querySelector(`#auto-tick-step`),m=document.querySelector(`#toggle-auto-tick`),h=document.querySelector(`#clear-intent`),g=document.querySelector(`#copy-intent`),_=document.querySelector(`#probe-execute-script`),v=document.querySelector(`#probe-invoke-script`),ee=document.querySelector(`.event-log-wrap`),y=document.querySelector(`#toggle-event-log`),b=document.querySelector(`#clear-event-log`),x=document.querySelector(`#event-log-export-format`),S=document.querySelector(`#export-event-log`),C=document.querySelector(`.trace-wrap`),w=document.querySelector(`#toggle-trace`),T=document.querySelector(`#runtime-inspector`),E=document.querySelector(`#status`),D=document.querySelector(`#runtime-state`),O=document.querySelector(`#event-log`),te=document.querySelector(`.example-meta`),ne=document.querySelector(`#toggle-example-meta`),re=document.querySelector(`#example-title`),ie=document.querySelector(`#example-coverage`),ae=document.querySelector(`#example-description`),oe=document.querySelector(`#example-goal`),se=document.querySelector(`#example-testing-ac`);if(!e||!t||!n||!r||!i||!a||!o||!s||!c||!l||!u||!d||!f||!p||!m||!h||!g||!_||!v||!ee||!y||!b||!x||!S||!C||!w||!T||!E||!D||!O||!te||!ne||!re||!ie||!ae||!oe||!se)throw Error(`Host sample DOM not found`);r.replaceChildren();for(let e of fe){let t=document.createElement(`option`);t.value=e.key,t.textContent=e.label,r.appendChild(t)}if(fe.length===0)throw Error(`No examples available. Run: pnpm run examples:generate`);let ce=new Map(fe.map(e=>[e.key,e])),k=fe[0];r.value=k.key,t.value=k.wml;let A=await de(e,t.value);E.textContent=`Loaded example: ${k.key}`;let j=k.key,M={title:re,coverage:ie,description:ae,goal:oe,testingAc:se},N=me({container:te,toggleButton:ne,collapsedClass:`is-collapsed`}),ye=me({container:i,toggleButton:a,collapsedClass:`is-collapsed`}),be=me({container:ee,toggleButton:y,collapsedClass:`is-collapsed`}),xe=me({container:C,toggleButton:w,collapsedClass:`is-collapsed`}),P=new ge(O,k.key);T.addEventListener(`trace-clear-requested`,()=>{A.clearTraceEntries(),T.entries=A.traceEntries(),E.textContent=`Cleared engine trace.`,I(`TRACE_CLEARED`)}),T.addEventListener(`trace-exported`,e=>{let t=e.detail;if(t.outcome===`empty`){E.textContent=`No engine trace entries to export.`,I(`TRACE_EXPORT_SKIPPED (empty)`);return}E.textContent=`Exported ${t.count} engine trace entr${t.count===1?`y`:`ies`} as ${t.format}.`,I(`TRACE_EXPORTED (${t.format})`)}),T.addEventListener(`trace-preset-applied`,e=>{let t=e.detail;E.textContent=`Applied trace preset: ${t.preset}`,I(`TRACE_PRESET (${t.preset})`)});let F=()=>{let e=A.snapshot();return he(D,e),T.entries=A.traceEntries(),e},I=(e,t)=>P.append(e,t);window.__WAVENAV_STORY_EVIDENCE__={collect:()=>({activeExampleKey:j,snapshot:A.snapshot(),traceEntries:A.traceEntries(),status:E.textContent??``,eventLog:O.textContent??``,frame:A.renderFrame()}),activateAction:e=>{let t=A.renderFrame();A.handleInput({type:`activate-action`,frameId:t.frameId,actionId:e});let n=F();E.textContent=`Activated ${e}. Active card: ${n.activeCardId}`,I(`ACTIVATE_ACTION (${e})`,n)},click:(e,t)=>{let n=A.renderFrame();A.handleInput({type:`click`,frameId:n.frameId,x:e,y:t});let r=F();E.textContent=`Clicked (${e}, ${t}). Active card: ${r.activeCardId}`,I(`CLICK (${e},${t})`,r)},scroll:e=>{let t=A.renderFrame();A.handleInput({type:`scroll`,frameId:t.frameId,deltaRows:e});let n=F();E.textContent=`Scrolled ${e} row(s).`,I(`SCROLL (${e})`,n)}};let Se=(e,n)=>{try{A.loadDeck(t.value);let r=F();E.textContent=`${e} Active card: ${r.activeCardId}`,I(`LOAD (${n})`,r)}catch(e){E.textContent=`Load error: ${String(e)}`;let t=F();I(`LOAD_ERROR (${n}) ${String(e)}`,t)}},L=e=>{try{A.pressKey(e);let t=F();if(t.lastRuntimeFailureCode){let n=t.lastRuntimeFailureCode===`WML_CONTEXT_RESET`?`Browser memory was exhausted. The page context was reset.`:`The requested page action could not be completed.`;E.textContent=`Key error (${e}): ${n}`,I(`KEY_ERROR ${e} ${t.lastRuntimeFailureCode}`,t)}else E.textContent=`Key "${e}" applied. Active card: ${t.activeCardId}`,I(`KEY ${e}`,t)}catch(t){let n=F();if(n.lastRuntimeFailureCode){let t=n.lastRuntimeFailureCode===`WML_CONTEXT_RESET`?`Browser memory was exhausted. The page context was reset.`:`The requested page action could not be completed.`;E.textContent=`Key error (${e}): ${t}`,I(`KEY_ERROR ${e} ${n.lastRuntimeFailureCode}`,n)}else E.textContent=`Key error (${e}): ${String(t)}`,I(`KEY_ERROR ${e} ${String(t)}`,n)}},R=ft;p.value=String(R);let z=null,B=()=>{let e=z!==null;m.setAttribute(`aria-pressed`,e?`true`:`false`),m.textContent=e?`Auto Tick: On (${R}ms)`:`Auto Tick: Off`},V=e=>{if(z&&(clearInterval(z),z=null,B(),e)){let t=F();E.textContent=e,I(`AUTO_TICK_STOP`,t)}},H=null;r.addEventListener(`change`,()=>{let e=r.value,n=ce.get(e);n&&(j=e,P.setActiveExample(e),t.value=n.wml,_e(M,n),I(`EXAMPLE_SELECTED`),Se(`Loaded example: ${e}.`,`example-select`))}),ne.addEventListener(`click`,()=>N.toggle()),a.addEventListener(`click`,()=>ye.toggle()),y.addEventListener(`click`,()=>be.toggle()),w.addEventListener(`click`,()=>xe.toggle()),n.addEventListener(`click`,()=>{Se(`Deck reloaded.`,`manual-reload`)}),t.addEventListener(`input`,()=>{o.checked&&(H&&clearTimeout(H),H=setTimeout(()=>{Se(`Live reload complete.`,`live-reload`),H=null},dt))}),c.addEventListener(`click`,()=>L(`up`)),l.addEventListener(`click`,()=>L(`down`)),u.addEventListener(`click`,()=>L(`enter`)),e.addEventListener(`click`,t=>{try{let n=le(e,A.renderFrame(),t.clientX,t.clientY);if(!n)return;A.handleInput(n);let r=F();E.textContent=`Pointer activation applied. Active card: ${r.activeCardId}`,I(`POINTER CLICK (${n.x},${n.y})`,r)}catch(e){let t=F();E.textContent=`Pointer error: ${String(e)}`,I(`POINTER_ERROR ${String(e)}`,t)}}),e.addEventListener(`wheel`,e=>{try{let t=ue(A.renderFrame(),e.deltaY);if(!t)return;e.preventDefault(),A.handleInput(t);let n=F();E.textContent=`Scrolled ${t.deltaRows} row(s).`,I(`SCROLL (${t.deltaRows})`,n)}catch(e){let t=F();E.textContent=`Scroll error: ${String(e)}`,I(`SCROLL_ERROR ${String(e)}`,t)}},{passive:!1});let Ce=(e,t=`manual`)=>{try{let n=A.snapshot().activeCardId;A.advanceTimeMs(e);let r=F();if(t===`manual`){E.textContent=`Advanced timer clock by ${e}ms. Active card: ${r.activeCardId}`,I(`TICK ${e}ms`,r);return}r.activeCardId!==n&&(E.textContent=`Auto tick advanced card: ${n} -> ${r.activeCardId}`,I(`AUTO_TICK_NAV ${n}->${r.activeCardId}`,r))}catch(n){let r=F();if(t===`auto`){V(),E.textContent=`Auto tick error (${e}ms): ${String(n)}`,I(`AUTO_TICK_ERROR ${e}ms ${String(n)}`,r);return}E.textContent=`Tick error (${e}ms): ${String(n)}`,I(`TICK_ERROR ${e}ms ${String(n)}`,r)}},U=()=>{if(z)return;z=setInterval(()=>Ce(R,`auto`),R),B();let e=F();E.textContent=`Auto tick started (${R}ms).`,I(`AUTO_TICK_START`,e)};d.addEventListener(`click`,()=>Ce(100)),f.addEventListener(`click`,()=>Ce(1e3)),p.addEventListener(`change`,()=>{let e=Number.parseInt(p.value,10);if(!pt.has(e)){p.value=String(R);return}if(R=e,z){V(),U();return}B()}),m.addEventListener(`click`,()=>{if(z){V(`Auto tick stopped (${R}ms).`);return}U()}),s.addEventListener(`click`,()=>{let e=A.navigateBack(),t=F();E.textContent=e?`Back applied. Active card: ${t.activeCardId}`:`Back ignored (history empty).`,I(e?`BACK`:`BACK_EMPTY`,t)}),h.addEventListener(`click`,()=>{A.clearExternalNavigationIntent();let e=F();E.textContent=`External navigation intent cleared.`,I(`INTENT_CLEARED`,e)}),g.addEventListener(`click`,async()=>{let e=A.snapshot(),t=e.externalNavigationIntent;if(!t){E.textContent=`No external intent to copy.`,I(`INTENT_COPY_SKIPPED (none)`,e);return}try{await navigator.clipboard.writeText(t),E.textContent=`External intent URL copied.`,I(`INTENT_COPIED`,e)}catch(t){E.textContent=`Copy intent failed: ${String(t)}`,I(`INTENT_COPY_ERROR ${String(t)}`,e)}}),_.addEventListener(`click`,()=>{try{let e=A.executeScriptRefFunction(`wavescript-fixtures.wmlsc`,`externalGo`),t=F();E.textContent=`executeScriptRefFunction externalGo => ok=${e.ok}; intent=${t.externalNavigationIntent??`(none)`}`,I(`SCRIPT_PROBE_EXECUTE externalGo`,t)}catch(e){let t=F();E.textContent=`executeScriptRefFunction error: ${String(e)}`,I(`SCRIPT_PROBE_EXECUTE_ERROR ${String(e)}`,t)}}),v.addEventListener(`click`,()=>{try{let e=A.invokeScriptRefFunction(`wavescript-fixtures.wmlsc`,`externalGo`),t=F();E.textContent=`invokeScriptRefFunction externalGo => nav=${e.navigationIntent.type}; intent=${t.externalNavigationIntent??`(none)`}`,I(`SCRIPT_PROBE_INVOKE externalGo`,t)}catch(e){let t=F();E.textContent=`invokeScriptRefFunction error: ${String(e)}`,I(`SCRIPT_PROBE_INVOKE_ERROR ${String(e)}`,t)}}),b.addEventListener(`click`,()=>{P.clearActive(),E.textContent=`Cleared event log for example: ${j}`}),S.addEventListener(`click`,()=>{let e=x.value===`json`?`json`:`txt`,t=P.exportActive(e);if(!t){E.textContent=`No events to export for example: ${j}`,I(`EVENT_LOG_EXPORT_SKIPPED (empty)`);return}ve(t),E.textContent=`Exported event log for example: ${j}`,I(`EVENT_LOG_EXPORTED`)}),window.addEventListener(`keydown`,e=>{if(e.target===t)return;let n=pe(e.key);n&&(e.preventDefault(),L(n))}),window.addEventListener(`beforeunload`,()=>{V()}),_e(M,k),N.apply(),ye.apply(),be.apply(),xe.apply(),B();let we=F();I(`BOOT`),I(`INITIAL_LOAD`,we),P.renderActive()}mt().catch(e=>{let t=document.querySelector(`#status`);t&&(t.textContent=`Boot error: ${String(e)}`)});