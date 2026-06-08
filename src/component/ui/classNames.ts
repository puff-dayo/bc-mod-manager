type ClassValue = string | false | null | undefined;

export default function classNames(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
