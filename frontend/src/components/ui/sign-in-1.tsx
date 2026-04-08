import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  logoSrc: string;
  logoAlt?: string;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }[];
  skipAction?: {
    label: string;
    onClick: () => void;
  };
  footerContent?: React.ReactNode;
  children?: React.ReactNode;
}

const AuthForm = React.forwardRef<HTMLDivElement, AuthFormProps>(
  (
    {
      className,
      logoSrc,
      logoAlt = "Company Logo",
      title,
      description,
      primaryAction,
      secondaryActions,
      skipAction,
      footerContent,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("auth-form-shell", className)} {...props}>
        <Card ref={ref} className="auth-form-card">
          <CardHeader className="auth-form-header">
            <div className="auth-form-logo-wrap">
              <img src={logoSrc} alt={logoAlt} className="auth-form-logo" />
            </div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="auth-form-content">
            {children}

            {primaryAction ? (
              <Button onClick={primaryAction.onClick} className="auth-form-button">
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            ) : null}

            {secondaryActions && secondaryActions.length > 0 ? (
              <>
                <div className="auth-form-separator">
                  <span />
                  <em>or</em>
                  <span />
                </div>
                <div className="auth-form-actions">
                  {secondaryActions.map((action, index) => (
                    <Button
                      key={`${action.label}-${index}`}
                      variant="secondary"
                      className="auth-form-button"
                      onClick={action.onClick}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </>
            ) : null}
          </CardContent>

          {skipAction ? (
            <CardFooter className="auth-form-footer">
              <Button variant="outline" className="auth-form-button" onClick={skipAction.onClick}>
                {skipAction.label}
              </Button>
            </CardFooter>
          ) : null}
        </Card>

        {footerContent ? (
          <div className="auth-form-legal">{footerContent}</div>
        ) : null}
      </div>
    );
  },
);
AuthForm.displayName = "AuthForm";

export { AuthForm };
