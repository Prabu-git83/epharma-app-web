import { cva, type VariantProps } from 'class-variance-authority'
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        rx:      'bg-amber-100 text-amber-800',
        otc:     'bg-green-100 text-green-700',
        neutral: 'bg-gray-100 text-gray-600',
        danger:  'bg-red-100 text-red-700',
        info:    'bg-blue-100 text-blue-700',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
