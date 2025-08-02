// import { forwardRef } from "react"

// const Input = forwardRef(({ label, error, className = "", type = "text", ...props }, ref) => {
//   return (
//     <div className="space-y-1">
//       {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
//       <input
//         ref={ref}
//         type={type}
//         className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm ${
//           error ? "border-red-500 focus:ring-red-500" : ""
//         } ${className}`}
//         {...props}
//       />
//       {error && <p className="text-sm text-red-600">{error}</p>}
//     </div>
//   )
// })

// Input.displayName = "Input"

// export default Input
import { forwardRef } from "react";

const Input = forwardRef(({ className = "", type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export default Input;
