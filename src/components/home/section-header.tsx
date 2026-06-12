interface SectionHeaderProps {
  title: string;
  highlight?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({
  title,
  highlight,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between lg:mb-14">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
          {title}
          {highlight && (
            <>
              {" "}
              <span className="text-gradient-gold">{highlight}</span>
            </>
          )}
        </h2>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
