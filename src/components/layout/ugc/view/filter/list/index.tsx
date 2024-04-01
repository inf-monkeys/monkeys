//
// interface Props {
//   selectedRuleId: string | null;
//   onChange: (selectedRuleId: string | null) => void;
//   rules: UgcFilterRules[];
//   tags: string[];
//   filter: ListUgcDto['filter'];
//   onFilterChange: (filter: ListUgcDto['filter'], clear?: boolean) => void;
//   fetchList?: () => void;
//   ugcType: AssetType;
// }
//
// export const UgcFilterRuleList: React.FC<Props> = ({ selectedRuleId, onChange, rules, tags, onFilterChange, filter, fetchList, ugcType }) => {
//   const [search, setSearch] = useState('');
//
//   const displayRules = useMemo(() => {
//     return search.trim() ? rules.filter((rule) => rule.name.includes(search)) : rules;
//   }, [search, rules]);
//
//   return (
//     <div className="flex h-[calc(100vh-72px)] w-full flex-col gap-3">
//       <div className="flex flex-shrink-0 gap-2 pr-2">
//         <Input placeholder="搜索分组名称" prefix={<IconPriceTag />} className="flex-1" showClear value={search} onChange={setSearch} />
//         <FilterButton filter={filter} onChange={onFilterChange} tags={tags} fetchList={fetchList} initialAddToFilterVisible ugcType={ugcType}></FilterButton>
//       </div>
//
//       <div className="flex flex-1 flex-col gap-1 overflow-y-scroll">
//         <div
//           className={classNames(
//             'flex vines-nav-item',
//             {
//               '!bg-[var(--semi-color-primary-light-default)]': selectedRuleId === null,
//             },
//           )}
//           onClick={() => {
//             onChange(null);
//           }}
//         >
//           <span className="line-clamp-1 text-xs">全部</span>
//         </div>
//         {displayRules?.map((rule) => (
//           <div
//             className={classNames(
//               'group vines-nav-item',
//               {
//                 '!bg-[var(--semi-color-primary-light-default)]': rule._id === selectedRuleId,
//               },
//             )}
//             key={rule._id}
//             onClick={() => {
//               onChange(rule._id);
//             }}
//           >
//             <span className="line-clamp-1 text-xs">{rule.name}</span>
//
//             <div className="flex items-center gap-2">
//               <div className="hidden opacity-70 group-hover:flex">
//                 <Dropdown
//                   menu={[
//                     {
//                       node: 'item',
//                       name: '删除',
//                       icon: <TrashIcon />,
//                       onClick: (e) => {
//                         e.stopPropagation();
//                         e.preventDefault();
//                         Modal.confirm({
//                           title: '删除前确认',
//                           content: `是否删除分组「${rule.name}」?`,
//                           onOk: async () => {
//                             const res = await removeUgcFilterRules(rule._id);
//                             if (res) {
//                               fetchList?.();
//                               Toast.success('删除成功');
//                             }
//                           },
//                         });
//                       },
//                     },
//                   ]}
//                 >
//                   <IconMore />
//                 </Dropdown>
//               </div>
//               {rule._id === selectedRuleId && (
//                 <div className="flex flex-shrink-0 opacity-70">
//                   <IconTickCircle />
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
