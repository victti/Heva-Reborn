import koffi from 'koffi';

// Load Windows DLLs
const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');

// Define functions with correct Windows types
const is64bit = process.arch === 'x64';
const LONG_PTR = is64bit ? 'int64' : 'int32';

const DefWindowProcA = user32.func(`${LONG_PTR} __stdcall DefWindowProcA(void* hwnd, uint32 msg, uint64 wParam, int64 lParam)`);
const CreateWindowExA = user32.func('void* __stdcall CreateWindowExA(uint32 dwExStyle, str lpClassName, str lpWindowName, uint32 dwStyle, int32 x, int32 y, int32 nWidth, int32 nHeight, void* hWndParent, void* hMenu, void* hInstance, void* lpParam)');
const FindWindowA = user32.func('void* __stdcall FindWindowA(str lpClassName, str lpWindowName)');
const ShowWindow = user32.func('bool __stdcall ShowWindow(void* hwnd, int32 nCmdShow)');
const GetLastError = kernel32.func('uint32 __stdcall GetLastError()');

// Message loop functions
const PeekMessageA = user32.func('bool __stdcall PeekMessageA(void* lpMsg, void* hWnd, uint32 min, uint32 max, uint32 removeMsg)');
const GetMessageA = user32.func('int32 __stdcall GetMessageA(void* lpMsg, void* hWnd, uint32 wMsgFilterMin, uint32 wMsgFilterMax)');
const TranslateMessage = user32.func('bool __stdcall TranslateMessage(void* lpMsg)');
const DispatchMessageA = user32.func(`${LONG_PTR} __stdcall DispatchMessageA(void* lpMsg)`);

const WNDPROC = koffi.proto(
    `${LONG_PTR} __stdcall WndProc(void* hwnd, uint32 msg, uint64 wParam, int64 lParam)`
);

// Define WNDCLASSEX structure
const WNDCLASSEXA = koffi.struct('WNDCLASSEXA', {
    cbSize: 'uint32',
    style: 'uint32',
    lpfnWndProc: koffi.pointer(WNDPROC),
    cbClsExtra: 'int32',
    cbWndExtra: 'int32',
    hInstance: 'void*',
    hIcon: 'void*',
    hCursor: 'void*',
    hbrBackground: 'void*',
    lpszMenuName: 'str',
    lpszClassName: 'str',
    hIconSm: 'void*'
});

const RegisterClassExA = user32.func('uint16 __stdcall RegisterClassExA(WNDCLASSEXA* wndclass)');

// MSG structure for message loop
const MSG = koffi.struct('MSG', {
    hwnd: 'void*',
    message: 'uint32',
    wParam: 'uint64',
    lParam: 'int64',
    time: 'uint32',
    pt_x: 'int32',
    pt_y: 'int32'
});

// Create window procedure callback
const wndProc = koffi.register((hwnd: any, msg: number, wParam: bigint, lParam: bigint) => {
    if (msg === 0x4C8) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Received message 0x4C8 from game!');
        console.log('wParam:', wParam.toString());
        console.log('lParam:', lParam.toString());
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Process your game message here
        // You can parse wParam and lParam based on what the game sends
        
        return is64bit ? 0n : 0;
    }
    
    const result = DefWindowProcA(hwnd, msg, wParam, lParam);
    return result;
}, koffi.pointer(WNDPROC));

// Create window class structure
const wc: any = {
    cbSize: koffi.sizeof(WNDCLASSEXA),
    style: 0,
    lpfnWndProc: wndProc,
    cbClsExtra: 0,
    cbWndExtra: 0,
    hInstance: null,
    hIcon: null,
    hCursor: null,
    hbrBackground: null,
    lpszMenuName: null,
    lpszClassName: 'TOGPLAUNCHERFRAME',
    hIconSm: null
};

console.log('🚀 Starting fake launcher...');
console.log('Registering window class TOGPLAUNCHERFRAME...');

const atom = RegisterClassExA(wc);

if (atom === 0) {
    console.error('❌ Failed to register window class');
    console.error('Error code:', GetLastError());
    process.exit(1);
}

console.log('✅ Window class registered successfully, atom:', atom);

// Create the window with custom class name
const WS_OVERLAPPEDWINDOW = 0x00CF0000;
const customHwnd = CreateWindowExA(
    0,                      // dwExStyle
    'TOGPLAUNCHERFRAME',    // lpClassName - the game will look for this
    'Fake Launcher',        // lpWindowName
    WS_OVERLAPPEDWINDOW,    // dwStyle
    100, 100,               // x, y
    400, 300,               // width, height
    null,                   // hWndParent
    null,                   // hMenu
    null,                   // hInstance
    null                    // lpParam
);

if (!customHwnd) {
    console.error('❌ Failed to create custom window');
    console.error('Error code:', GetLastError());
    process.exit(1);
}

console.log('✅ Custom window created successfully!');
console.log('HWND:', customHwnd);

// Verify the window can be found by class name
const foundHwnd = FindWindowA('TOGPLAUNCHERFRAME', null);
console.log('FindWindow result:', foundHwnd);
console.log('Windows match:', foundHwnd === customHwnd);

// Show the window
ShowWindow(customHwnd, 5); // SW_SHOW = 5

console.log('\n🎮 Fake launcher is ready!');
console.log('Waiting for messages from the game...\n');

// Message loop
const msg = koffi.alloc(MSG, 1);

setInterval(() => {
    while (PeekMessageA(msg, null, 0, 0, 1)) {
        TranslateMessage(msg);
        DispatchMessageA(msg);
    }
}, 1);

console.log('Message loop ended');