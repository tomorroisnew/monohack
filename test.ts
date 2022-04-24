var hMono = Process.getModuleByName("mono-2.0-bdwgc.dll") //Hook the mono module

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

//Var Method Stuff
var mono_compile_method = new NativeFunction(hMono.getExportByName("mono_compile_method"), 'pointer', ['pointer'])

//Field Stuff
var mono_class_get_field_from_name = new NativeFunction(hMono.getExportByName("mono_class_get_field_from_name"), 'pointer', ['pointer', 'pointer'])
var mono_field_get_offset = new NativeFunction(hMono.getExportByName("mono_field_get_offset"), 'int', ['pointer'])

//Main Script

// Attach thread to root domain. This is needed for the mono_compile_method. I spent hours figuring this out.
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

//Get the NewMovement Class. To use const char*, we need to allocate first using allocUtf8String and it will return a pointer to our string
var NewMovementClass = mono_class_from_name(ptr(AssemblyCsharpAssembly), Memory.allocUtf8String(""), Memory.allocUtf8String("NewMovement"))

//Get Update Method address and hook it
var NewMovementUpdateMethod = mono_class_get_method_from_name(NewMovementClass, Memory.allocUtf8String("Update"), 0)
var NewMovement_Update = mono_compile_method(NewMovementUpdateMethod)

