import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ElementType } from "react";

interface CategoryCardProps {
  category: {
    key: string;
    title: string;
    description: string;
    icon: ElementType;
    color: string;
    stats?: string;
    actionText: string;
    href: string;
    imageUrl?: string;
    tags?: string[];
    nextEvent?: {
      title: string;
      time: string;
    };
  };
  index?: number;
  className?: string;
}

export function CategoryCard({ category, index = 0, className }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={cn("masonry-item", className)}
    >
      <Card className="floating-card overflow-hidden group">
        {category.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={category.imageUrl} 
              alt={category.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center mr-4",
              category.color
            )}>
              {category.icon && (
                <category.icon className="text-xl" />
              )}
            </div>
            <h3 className="text-xl font-semibold">{category.title}</h3>
          </div>

          <p className="text-muted-foreground mb-4 leading-relaxed">
            {category.description}
          </p>

          {category.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {category.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {category.nextEvent && (
            <div className="bg-secondary rounded-lg p-3 mb-4">
              <div className="text-sm text-muted-foreground mb-1">Next Event</div>
              <div className="font-medium text-sm">{category.nextEvent.title}</div>
              <div className="text-xs text-muted-foreground">{category.nextEvent.time}</div>
            </div>
          )}

          <div className="flex items-center justify-between">
            {category.stats && (
              <span className="text-sm font-medium text-primary">
                {category.stats}
              </span>
            )}
            
            <Link href={category.href}>
              <Button 
                className={cn(
                  "hover:opacity-90 transition-opacity",
                  category.stats ? "" : "w-full"
                )}
                data-testid={`button-${category.key}`}
              >
                {category.actionText}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Masonry Grid component for category cards
interface CategoryGridProps {
  categories: CategoryCardProps['category'][];
  className?: string;
}

export function CategoryGrid({ categories, className }: CategoryGridProps) {
  return (
    <div className={cn("masonry-grid", className)}>
      {categories.map((category, index) => (
        <CategoryCard
          key={category.key}
          category={category}
          index={index}
        />
      ))}
    </div>
  );
}
