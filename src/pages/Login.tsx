import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-background to-primary/10">
      {/* Gradient Blobs - Enhanced intensity */}
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] rounded-full bg-purple-400/40 blur-3xl animate-pulse" 
           style={{ animationDuration: '5s' }} />
      <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] rounded-full bg-indigo-400/40 blur-3xl animate-pulse" 
           style={{ animationDuration: '6s' }} />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-pink-400/30 blur-3xl animate-pulse" 
           style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-violet-400/30 blur-3xl animate-pulse" 
           style={{ animationDuration: '9s' }} />
      
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 px-4 py-8 relative z-10">
        <div className="hidden md:flex flex-col justify-center items-center p-4 animate-fade-in">
          <div className="max-w-lg transform hover:rotate-2 transition-transform duration-300">
            <img 
              src="https://branzontech.com/wp-content/uploads/2025/05/purple_dino_4-removebg-preview.png" 
              alt="Smart File" 
              className="w-full h-auto object-contain drop-shadow-[0_10px_10px_rgba(120,78,214,0.4)] animate-pulse-once"
            />
          </div>
        </div>
        
        <div className="flex flex-col justify-center items-center p-4 animate-slide-in">
          <div className="w-full max-w-md space-y-6">
            <div className="text-left space-y-2 mb-8">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent drop-shadow-sm">Smart File</h1>
              <p className="text-muted-foreground">Sistema para gestión de documentación</p>
            </div>
            
            <SignIn 
              routing="hash"
              forceRedirectUrl="/editor"
              signUpUrl="/register"
              appearance={{
                elements: {
                  rootBox: "w-full mx-auto",
                  card: "shadow-none border-0 bg-transparent",
                  header: "hidden",
                  footer: {
                    justifyContent: "center",
                    textAlign: "center"
                  },
                  formButtonPrimary: "bg-primary hover:bg-primary/90",
                  formFieldInput: "bg-background/80",
                  socialButtonsBlockButton: "border-border hover:bg-muted",
                  socialButtonsBlockButtonText: "text-foreground",
                  dividerLine: "bg-border",
                  dividerText: "text-muted-foreground text-xs",
                  formFieldLabel: "text-foreground"
                }
              }}
            />
            
            <div className="md:hidden flex justify-center mt-6">
              <img 
                src="https://branzontech.com/wp-content/uploads/2025/05/purple_dino_4-removebg-preview.png" 
                alt="Smart File"
                className="w-4/5 h-auto object-contain drop-shadow-[0_10px_10px_rgba(120,78,214,0.4)] animate-pulse-once" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
