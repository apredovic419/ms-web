'use client';

import {SelectProductCategory} from "@/lib/db/product-category";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {
  AlignLeftIcon,
  ArrowUp10Icon,
  BarChartBigIcon,
  BoxesIcon,
  CalendarIcon,
  DollarSignIcon,
  PackageIcon,
  TagIcon,
} from "lucide-react";
import {createProduct, State} from '@/lib/actions/store/create-product';
import SelectBox from '@/components/ui/select-box';
import React, {useActionState} from "react";
import {useDebouncedCallback} from "use-debounce";
import clsx from 'clsx';
import { Switch } from "@/components/ui/switch";
import {currencyList, deliveryMethodList, validExtendFields} from "@/lib/definitions";
import {DurationPicker} from "../components/duration-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";


export default function Form({categories}: { categories: SelectProductCategory[] }) {
  const initialState: State = {message: null, errors: {}, values: {}};
  const [state, formAction] = useActionState(createProduct, initialState);
  const [itemIco, setItemIco] = React.useState('/item-icon-blur.jpg');
  const [limitedStock, setLimitedStock] = React.useState(false);
  const [duration, setDuration] = React.useState(false);
  const [purchasable, setPurchasable] = React.useState(true);
  const [display, setDisplay] = React.useState(true);
  const [gifting, setGifting] = React.useState(true);
  const [limitPurchase, setLimitPurchase] = React.useState(false);
  const [itemExpire, setItemExpire] = React.useState(true);
  const [itemExtend, setItemExtend] = React.useState(false);
  const [deliverMethod, setDeliverMethod] = React.useState(deliveryMethodList[0]);
  const [jsonText, setJsonText] = React.useState('');
  const [jsonError, setJsonError] = React.useState<string | null>(null);

  const handlerItemIco = useDebouncedCallback((value: string) => {
    if (itemIco.startsWith("data:image")) {
      return;
    }
    setItemIco(`https://maplestory.io/api/GMS/253/item/${value}/iconRaw`);
  }, 300);

  const validateAndFormatJSON = (text: string) => {
    try {
      const parsedJSON = JSON.parse(text);

      // Validate fields and types
      const invalidFields: string[] = [];
      const invalidTypes: string[] = [];

      Object.entries(parsedJSON).forEach(([key, value]) => {
        if (!validExtendFields.includes(key)) {
          invalidFields.push(key);
        } else if (typeof value !== 'number' || !Number.isInteger(value)) {
          invalidTypes.push(key);
        }
      });

      if (invalidFields.length > 0 || invalidTypes.length > 0) {
        let errorMessage = '';
        if (invalidFields.length > 0) {
          errorMessage += `Invalid fields: ${invalidFields.join(', ')}. `;
        }
        if (invalidTypes.length > 0) {
          errorMessage += `Fields with invalid types (should be integers): ${invalidTypes.join(', ')}.`;
        }
        setJsonError(errorMessage.trim());
        return;
      }

      // If all validations pass, format the JSON
      const formattedJSON = JSON.stringify(parsedJSON, null, 4);
      setJsonText(formattedJSON);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON format');
    }
  };

  const uploadIco = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setItemIco(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  const handleDeliverMethodChange = (method: any) => {
    setDeliverMethod(method);
    if (method.id === 0) { // Game Store
      setItemExpire(true);
      if (state.values) {
        state.values.expiration = '5184000'; // 60 days
      }
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Configure basic product information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 物品ID和图标 */}
          <div className="grid grid-cols-[200px,48px] gap-6">
            <div className="grid gap-2">
              <label htmlFor="itemId" className="text-sm font-medium leading-none">
                Item ID
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="itemId"
                  name="itemId"
                  min="0"
                  defaultValue={state.values?.itemId?.toString() || ''}
                  onChange={(e) => handlerItemIco(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enter item ID..."
                  aria-describedby="itemId-error"
                />
                <TagIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
              </div>
              <div id="itemId-error" aria-live="polite" aria-atomic="true">
                {state.errors?.itemId?.map((error: string) => (
                  <p className="text-sm text-destructive" key={error}>{error}</p>
                ))}
              </div>
            </div>
            <div className="flex pt-4">
              <img
                src={itemIco}
                alt="Item Icon"
                className="h-12  w-12 object-contain cursor-pointer rounded-md border border-input bg-background"
                onClick={uploadIco}
                onError={() => setItemIco('/item-icon-blur.jpg')}
              />
              <input type="hidden" name="itemIco" value={itemIco} />
              {itemIco !== '/item-icon-blur.jpg' && !itemIco.startsWith('https://') && (
                <button
                  type="button"
                  className="ml-2 text-sm text-destructive hover:text-destructive/80"
                  onClick={() => setItemIco('/item-icon-blur.jpg')}
                >
                  &#x2716;
                </button>
              )}
            </div>
          </div>

          {/* 标题 */}
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium leading-none">
              Product Title
            </label>
            <div className="relative">
              <input
                type="text"
                id="title"
                name="title"
                defaultValue={state.values?.title?.toString() || ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter product title..."
                aria-describedby="title-error"
              />
              <TagIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
            </div>
            <div id="title-error" aria-live="polite" aria-atomic="true">
              {state.errors?.title?.map((error: string) => (
                <p className="text-sm text-destructive" key={error}>{error}</p>
              ))}
            </div>
          </div>

          {/* 分类 */}
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none">
              Category
            </label>
            <SelectBox inputName="categoryId" items={categories} aria-describedby="category-error"/>
            <div id="category-error" aria-live="polite" aria-atomic="true">
              {state.errors?.categoryId?.map((error: string) => (
                <p className="text-sm text-destructive" key={error}>{error}</p>
              ))}
            </div>
          </div>

          {/* 描述 */}
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium leading-none">
              Description
            </label>
            <div className="relative">
              <textarea
                id="description"
                name="desc"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter product description..."
                aria-describedby="desc-error"
                defaultValue={state.values?.desc?.toString() || ''}
                rows={3}
              />
              <AlignLeftIcon className="absolute left-3 top-3 h-[18px] w-[18px] text-gray-500" />
            </div>
            <div id="desc-error" aria-live="polite" aria-atomic="true">
              {state.errors?.desc?.map((error: string) => (
                <p className="text-sm text-destructive" key={error}>{error}</p>
              ))}
            </div>
          </div>

          {/* 配送和货币设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Price and Delivery Settings</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">
                  Delivery Method
                </label>
                <div className="relative">
                  <SelectBox
                    inputName="receiveMethod"
                    items={deliveryMethodList}
                    name="receiveMethod"
                    selected={deliverMethod}
                    setSelected={handleDeliverMethodChange}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Select product delivery method</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">
                  Currency Type
                </label>
                <div className="relative">
                  <SelectBox
                    inputName="currency"
                    items={currencyList}
                    aria-describedby="currency-error"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Select product currency type</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 价格和排序设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Quantity, Price and Sorting</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="grid gap-2">
                <label htmlFor="count" className="text-sm font-medium leading-none">
                  Quantity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="count"
                    name="count"
                    min="1"
                    defaultValue={state.values?.count?.toString() || '1'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <PackageIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                </div>
                <p className="text-sm text-muted-foreground">Set quantity per purchase</p>
              </div>

              <div className="grid gap-2">
                <label htmlFor="price" className="text-sm font-medium leading-none">
                  Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    defaultValue={state.values?.price?.toString() || '0'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <DollarSignIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                </div>
                <p className="text-sm text-muted-foreground">Set product price</p>
              </div>

              <div className="grid gap-2">
                <label htmlFor="rank" className="text-sm font-medium leading-none">
                  Sort Order
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="rank"
                    name="rank"
                    defaultValue={state.values?.rank?.toString() || '0'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <ArrowUp10Icon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                </div>
                <p className="text-sm text-muted-foreground">Set display order</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 销售设置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Settings</CardTitle>
          <CardDescription>Configure product sales properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 库存设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium leading-none">Limited Stock</label>
                <p className="text-sm text-muted-foreground mt-1">Enable to set product stock quantity</p>
              </div>
              <Switch
                checked={limitedStock}
                onCheckedChange={setLimitedStock}
              />
            </div>
            {limitedStock && (
              <div className="pl-4 border-l-2 border-border">
                <div className="grid gap-2">
                  <label htmlFor="stock" className="text-sm font-medium leading-none">Stock Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      min="0"
                      defaultValue={state.values?.stock?.toString() || '0'}
                      className="flex h-10 w-full max-w-[200px] rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <BoxesIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* 销售期限设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium leading-none">Time-Limited Sale</label>
                <p className="text-sm text-muted-foreground mt-1">Set product sale time range</p>
              </div>
              <Switch
                checked={duration}
                onCheckedChange={setDuration}
              />
            </div>
            {duration && (
              <div className="pl-4 border-l-2 border-border">
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <label htmlFor="startTime" className="text-sm font-medium leading-none">Start Time</label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        id="startTime"
                        name="startTime"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      <CalendarIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="endTime" className="text-sm font-medium leading-none">End Time</label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        id="endTime"
                        name="endTime"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      <CalendarIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* 限购销售设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium leading-none">Purchase Limit</label>
                <p className="text-sm text-muted-foreground mt-1">Set product purchase restrictions</p>
              </div>
              <Switch
                checked={limitPurchase}
                onCheckedChange={setLimitPurchase}
              />
            </div>
            {limitPurchase && (
              <div className="pl-4 border-l-2 border-border">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <label htmlFor="limitGroup" className="text-sm font-medium leading-none">Limit Group</label>
                    <div className="relative">
                      <input
                        type="text"
                        id="limitGroup"
                        name="limitGroup"
                        maxLength={64}
                        className="flex h-10 w-full max-w-[300px] rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Enter limit group name..."
                      />
                      <TagIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Products in the same limit group share purchase limits</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <label htmlFor="userLimit" className="text-sm font-medium leading-none">Account Limit</label>
                      <div className="relative">
                        <input
                          type="number"
                          id="userLimit"
                          name="userLimit"
                          min="0"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Maximum purchases per account"
                        />
                        <PackageIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                      </div>
                      <div id="userLimit-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.userLimit?.map((error: string) => (
                          <p className="text-sm text-destructive" key={error}>{error}</p>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="charLimit" className="text-sm font-medium leading-none">Character Limit</label>
                      <div className="relative">
                        <input
                          type="number"
                          id="charLimit"
                          name="charLimit"
                          min="0"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-10 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder="Maximum purchases per character"
                        />
                        <PackageIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                      </div>
                      <div id="charLimit-error" aria-live="polite" aria-atomic="true">
                        {state.errors?.charLimit?.map((error: string) => (
                          <p className="text-sm text-destructive" key={error}>{error}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* 销售开关设置 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium leading-none">Purchasable</label>
                  <p className="text-sm text-muted-foreground mt-1">Allow this product to be purchased</p>
                </div>
                <Switch
                  checked={purchasable}
                  onCheckedChange={setPurchasable}
                  name="purchasable"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium leading-none">Giftable</label>
                  <p className="text-sm text-muted-foreground mt-1">Allow this product to be gifted</p>
                </div>
                <Switch
                  checked={gifting}
                  onCheckedChange={setGifting}
                  name="gifting"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium leading-none">Display Product</label>
                  <p className="text-sm text-muted-foreground mt-1">Show in cash shop</p>
                </div>
                <Switch
                  checked={display}
                  onCheckedChange={setDisplay}
                  name="display"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 物品属性卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>Item Properties</CardTitle>
          <CardDescription>Configure basic item properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 物品过期设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium leading-none">Item Expiration</label>
                <p className="text-sm text-muted-foreground mt-1">Set item validity period</p>
              </div>
              <Switch
                checked={itemExpire}
                onCheckedChange={() => {
                  if (deliverMethod.id === 0) { // Game Store
                    return;
                  }
                  setItemExpire(!itemExpire);
                }}
                disabled={deliverMethod.id === 0}
              />
            </div>
            {itemExpire && (
              <div className="pl-4 border-l-2 border-border">
                <div className="grid gap-2">
                  <DurationPicker
                    defaultValue={deliverMethod.id === 0 ? 5184000 : (parseInt(state.values?.expiration?.toString() || '5184000'))}
                    onChange={(value) => {
                      if (state.values) {
                        state.values.expiration = value.toString();
                      }
                    }}
                    name="expiration"
                    disabled={deliverMethod.id === 0}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* 扩展属性设置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium leading-none">Extended Properties</label>
                <p className="text-sm text-muted-foreground mt-1">Set item extended properties</p>
              </div>
              <Switch
                checked={itemExtend}
                onCheckedChange={setItemExtend}
              />
            </div>
            {itemExtend && (
              <div className="pl-4 border-l-2 border-border">
                <div className="grid gap-2">
                  <textarea
                    id="extend"
                    name="extend"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder='{"str": 2, "dex": 2, "int": 2, "luk": 2}'
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    onBlur={(e) => validateAndFormatJSON(e.target.value)}
                    rows={6}
                  />
                  {jsonError && (
                    <p className="text-sm text-destructive">{jsonError}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Valid fields: {validExtendFields.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 提交按钮 */}
      <div className="mt-6 flex items-center justify-end gap-4">
        <Button asChild variant="outline">
          <Link href="/store">Cancel</Link>
        </Button>
        <Button type="submit">Create Product</Button>
      </div>
    </form>
  )
}
