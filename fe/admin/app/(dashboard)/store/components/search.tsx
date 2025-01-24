'use client';

import {useTransition} from 'react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {Input} from '@/components/ui/input';
import {Spinner} from '@/components/icons';
import {Search} from 'lucide-react';
import {useDebouncedCallback} from 'use-debounce';


export function SearchInput() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const pathName = usePathname();

  function searchStore(formData: FormData) {
    let value = formData.get('query') as string;
    let params = new URLSearchParams({query: value});
    startTransition(() => {
      router.replace(`/store?${params.toString()}`);
    });
  }

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    router.push(`/store?${params.toString()}`);
  }, 300);

  return (
    <form action={searchStore} className="relative ml-auto flex-1 md:grow-0">
      <Search className="absolute left-2.5 top-[.75rem] h-4 w-4 text-muted-foreground"/>
      <Input
        name="query"
        type="search"
        placeholder="Search..."
        className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        defaultValue={searchParams.get('query') as string || ''}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
      />
      {isPending && <Spinner/>}
    </form>
  );
}
