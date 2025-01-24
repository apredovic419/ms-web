'use client'

import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {DatePickerWithRange} from "@/components/ui/date-range-picker";
import {useRouter, useSearchParams} from "next/navigation";
import {DateRange} from "react-day-picker";
import i18n from "@/lib/i18n";

const t = i18n.t;

const formSchema = z.object({
  dateRange: z.custom<DateRange | undefined>(),
  accountId: z.string().optional(),
  characterId: z.string().optional(),
  characterName: z.string().optional(),
  itemId: z.string().optional(),
  itemName: z.string().optional(),
});

export function FilterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateRange: {
        from: undefined,
        to: undefined,
      },
      accountId: searchParams.get("accountId") || "",
      characterId: searchParams.get("characterId") || "",
      characterName: searchParams.get("characterName") || "",
      itemId: searchParams.get("itemId") || "",
      itemName: searchParams.get("itemName") || "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const params = new URLSearchParams(searchParams);
    if (values.dateRange?.from) {
      params.set("from", values.dateRange.from.toISOString());
    } else {
      params.delete("from");
    }
    if (values.dateRange?.to) {
      params.set("to", values.dateRange.to.toISOString());
    } else {
      params.delete("to");
    }
    if (values.accountId) {
      params.set("accountId", values.accountId);
    } else {
      params.delete("accountId");
    }
    if (values.characterId) {
      params.set("characterId", values.characterId);
    } else {
      params.delete("characterId");
    }
    if (values.characterName) {
      params.set("characterName", values.characterName);
    } else {
      params.delete("characterName");
    }
    if (values.itemId) {
      params.set("itemId", values.itemId);
    } else {
      params.delete("itemId");
    }
    if (values.itemName) {
      params.set("itemName", values.itemName);
    } else {
      params.delete("itemName");
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="dateRange"
            render={({field}) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>{t('orders.filter.dateRange')}</FormLabel>
                <FormControl>
                  <DatePickerWithRange
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountId"
            render={({field}) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>{t('orders.filter.accountId')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('orders.filter.accountId')} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="characterId"
            render={({field}) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>{t('orders.filter.characterId')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('orders.filter.characterId')} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="characterName"
            render={({field}) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>{t('orders.filter.characterName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('orders.filter.characterName')} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="itemId"
            render={({field}) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>{t('orders.filter.itemId')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('orders.filter.itemId')} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="itemName"
            render={({field}) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>{t('orders.filter.itemName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('orders.filter.itemName')} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">{t('orders.filter.search')}</Button>
        </div>
      </form>
    </Form>
  );
} 