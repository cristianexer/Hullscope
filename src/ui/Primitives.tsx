import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Select from '@radix-ui/react-select';
import { CaretDown, CaretUp, Check, X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useLayoutEffect, useState } from 'react';
export function Modal({open,onOpenChange,title,description,children,wide=false}:{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;children:ReactNode;wide?:boolean}){return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className={`dialog-content ${wide?'wide':''}`}><div className="dialog-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="Close dialog"><X size={20}/></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;}
export function IconButton({label,children,onClick,active=false}:{label:string;children:ReactNode;onClick:()=>void;active?:boolean}){return <Tooltip.Root><Tooltip.Trigger asChild><button aria-label={label} className={`icon-button ${active?'active':''}`} onClick={onClick}>{children}</button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="tooltip" sideOffset={8}>{label}<Tooltip.Arrow/></Tooltip.Content></Tooltip.Portal></Tooltip.Root>;}

export type SelectOption = {value:string;label:string;disabled?:boolean};
export function ThemedSelect({label,value,onValueChange,options,disabled=false}:{label:string;value:string;onValueChange:(value:string)=>void;options:SelectOption[];disabled?:boolean}) {
 const [open,setOpen]=useState(false);
 const [content,setContent]=useState<HTMLDivElement|null>(null);
 useLayoutEffect(()=>{
  if(!open||!content)return;
  // Radix traps dropdown focus; inert also excludes background controls from the accessibility tree.
  const background=Array.from(document.body.children).filter((element):element is HTMLElement=>element instanceof HTMLElement&&!element.contains(content));
  const previous=background.map(element=>({element,inert:element.inert}));
  background.forEach(element=>{element.inert=true;});
  return()=>{previous.forEach(({element,inert})=>{element.inert=inert;});};
 },[open,content]);
 return <Select.Root value={value} onValueChange={onValueChange} disabled={disabled} open={open} onOpenChange={setOpen}>
  <Select.Trigger className="select-trigger" aria-label={label}><Select.Value/><Select.Icon><CaretDown size={13}/></Select.Icon></Select.Trigger>
  <Select.Portal><Select.Content ref={setContent} className="select-content" position="popper" sideOffset={6} collisionPadding={12}>
   <Select.ScrollUpButton className="select-scroll"><CaretUp size={14}/></Select.ScrollUpButton>
   <Select.Viewport className="select-viewport">{options.map(option=><Select.Item className="select-item" key={option.value} value={option.value} disabled={option.disabled}><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator className="select-indicator"><Check size={14}/></Select.ItemIndicator></Select.Item>)}</Select.Viewport>
   <Select.ScrollDownButton className="select-scroll"><CaretDown size={14}/></Select.ScrollDownButton>
  </Select.Content></Select.Portal>
 </Select.Root>;
}
