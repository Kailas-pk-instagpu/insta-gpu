import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * App-wide Sonner toast styled as a rounded pill with a colored icon badge,
 * tinted border, and an explicit close button. Adapts to light & dark mode
 * via semantic tokens so the look matches the reference design.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      icons={{
        success: (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-success ring-1 ring-success/30">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        ),
        error: (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 text-destructive ring-1 ring-destructive/30">
            <XCircle className="h-4 w-4" />
          </span>
        ),
        warning: (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warning/15 text-warning ring-1 ring-warning/30">
            <AlertTriangle className="h-4 w-4" />
          </span>
        ),
        info: (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <Info className="h-4 w-4" />
          </span>
        ),
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast pointer-events-auto flex items-center gap-3 w-full rounded-2xl border bg-card px-4 py-3 pr-10 shadow-lg text-foreground " +
            "data-[type=success]:border-success/40 " +
            "data-[type=error]:border-destructive/40 " +
            "data-[type=warning]:border-warning/40 " +
            "data-[type=info]:border-primary/40",
          title: "text-sm font-medium leading-snug",
          description: "text-xs text-muted-foreground leading-snug mt-0.5",
          icon: "shrink-0",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground rounded-md px-2.5 py-1 text-xs",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground rounded-md px-2.5 py-1 text-xs",
          closeButton:
            "!left-auto !right-3 !top-1/2 !-translate-y-1/2 !translate-x-0 !h-6 !w-6 !rounded-md !border-0 !bg-transparent !text-muted-foreground hover:!bg-foreground/5 hover:!text-foreground !opacity-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
