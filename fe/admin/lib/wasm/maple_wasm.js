import * as wasm from "./maple_wasm_bg.wasm";
export * from "./maple_wasm_bg.js";
import { __wbg_set_wasm } from "./maple_wasm_bg.js";
__wbg_set_wasm(wasm);