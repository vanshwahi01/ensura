import * as React from "react"
import { cn } from "@/lib/utils"
import { Upload, File, X } from "lucide-react"

export interface FileUploadProps {
  label?: string
  accept?: string
  onChange?: (file: File | null) => void
  value?: File | null
  className?: string
  id?: string
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ label, accept, onChange, value, className, id, ...props }, ref) => {
    const [fileName, setFileName] = React.useState<string>("")
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      setFileName(file?.name || "")
      onChange?.(file)
    }

    const handleClear = () => {
      if (inputRef.current) {
        inputRef.current.value = ""
      }
      setFileName("")
      onChange?.(null)
    }

    const handleClick = () => {
      inputRef.current?.click()
    }

    return (
      <div className={cn("relative", className)}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={id}
          {...props}
        />
        <div
          onClick={handleClick}
          className={cn(
            "flex items-center justify-between h-12 w-full rounded-lg border-2 border-teal/20 bg-white/90 backdrop-blur-sm px-5 py-3 text-base cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:border-teal/40",
            fileName && "border-teal/30"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {fileName ? (
              <>
                <File className="w-5 h-5 text-teal flex-shrink-0" />
                <span className="text-gray-900 truncate">{fileName}</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400">{label || "Choose file..."}</span>
              </>
            )}
          </div>
          {fileName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
FileUpload.displayName = "FileUpload"

export { FileUpload }

