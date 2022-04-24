//frida -U "Tap Titans" -l exploit.ts
var hMono = Process.getModuleByName("libmono.so")

//Domain Stuffs
var mono_get_root_domain = new NativeFunction(hMono.getExportByName("mono_get_root_domain"), 'pointer', [])
var mono_thread_attach = new NativeFunction(hMono.getExportByName("mono_thread_attach"), 'pointer', ['pointer'])

//Assemblies stuff
var mono_assembly_foreach = new NativeFunction(hMono.getExportByName("mono_assembly_foreach"), 'void', ['pointer', 'pointer']) //List all assembly
var mono_assembly_get_name  = new NativeFunction(hMono.getExportByName("mono_assembly_get_image"), 'pointer', ['pointer']) //Get image from assembly

//Image Stuff. I dont know what the purpose of image is, but it is needed for class operations.
var mono_image_get_name  = new NativeFunction(hMono.getExportByName("mono_image_get_name"), 'pointer', ['pointer'])

//Class stuff
var mono_class_from_name = new NativeFunction(hMono.getExportByName("mono_class_from_name"), 'pointer', ['pointer', 'pointer', 'pointer'])
var mono_class_get_method_from_name  = new NativeFunction(hMono.getExportByName("mono_class_get_method_from_name"), 'pointer', ['pointer', 'pointer', 'int'])
var mono_class_get_property_from_name = new NativeFunction(hMono.getExportByName("mono_class_get_property_from_name"), 'pointer', ['pointer', 'pointer'])
var mono_class_vtable = new NativeFunction(hMono.getExportByName("mono_class_vtable"), 'pointer', ['pointer', 'pointer'])

//Var Method Stuff
var mono_compile_method = new NativeFunction(hMono.getExportByName("mono_compile_method"), 'pointer', ['pointer'])

//Field Stuff
var mono_class_get_field_from_name = new NativeFunction(hMono.getExportByName("mono_class_get_field_from_name"), 'pointer', ['pointer', 'pointer'])
var mono_field_get_offset = new NativeFunction(hMono.getExportByName("mono_field_get_offset"), 'int', ['pointer'])
var mono_field_static_get_value  = new NativeFunction(hMono.getExportByName("mono_field_static_get_value"), 'void', ['pointer', 'pointer', 'pointer'])

//Property stuff
var mono_property_get_value  = new NativeFunction(hMono.getExportByName("mono_property_get_value"), 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'])

//Main Exploit

function Vector3(x,y,z){
    var Vector3pointer = Memory.alloc(12)
    Vector3pointer.add(0).writeFloat(x)
    Vector3pointer.add(4).writeFloat(y)
    Vector3pointer.add(8).writeFloat(z)
    return Vector3pointer
}

mono_thread_attach(mono_get_root_domain())

var AssemblyCsharpAssembly
function GetAssemblyCsharpCallback(MonoAssemblyObject, user_data){
    var MonoAssemblyImageObject = mono_assembly_get_name(MonoAssemblyObject) //Get the image. I dont know what that is
    var ImageName = mono_image_get_name(MonoAssemblyImageObject)
    if(ImageName.readUtf8String() == "Assembly-CSharp"){
        console.log("AssemblyCsharp Found. Assembly object at :" + MonoAssemblyImageObject)
        AssemblyCsharpAssembly = MonoAssemblyImageObject
    } 
}

//Fetch the assemblycsharp.dll image
mono_assembly_foreach(new NativeCallback(GetAssemblyCsharpCallback, 'void', ['pointer', 'pointer']), ptr(0))

var PlayerControllerClass = mono_class_from_name(ptr(AssemblyCsharpAssembly), Memory.allocUtf8String(""), Memory.allocUtf8String("PlayerController"))

var instanceProperty = mono_class_get_property_from_name(PlayerControllerClass, Memory.allocUtf8String("instance"))
var instanceObject = mono_property_get_value(instanceProperty, ptr(0), ptr(0), ptr(0))

var Ret = Memory.alloc(4)
mono_field_static_get_value(mono_class_vtable(mono_get_root_domain(), PlayerControllerClass), mono_class_get_field_from_name(PlayerControllerClass, Memory.allocUtf8String("sharedInstance")), Ret)
var LocalPlayer = Ret.readPointer()

var DoTapAttack = new NativeFunction(mono_compile_method(mono_class_get_method_from_name(PlayerControllerClass, Memory.allocUtf8String("DoTapAttack"), 1)), 'void', ['pointer', 'pointer'])
DoTapAttack(LocalPlayer, Vector3(0,0,0))
