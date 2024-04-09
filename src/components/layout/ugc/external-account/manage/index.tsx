import React from 'react';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteCredential, useCredentials } from '@/apis/credential';
import { IVinesCredentialType } from '@/apis/credential/typings.ts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';

interface IExternalAccountManageProps {
  detail: IVinesCredentialType | null;
}

export const ExternalAccountManage: React.FC<IExternalAccountManageProps> = ({ detail }) => {
  const { data: credentials, mutate } = useCredentials(detail?.name);

  const rows = detail?.properties?.filter((p) => p.type !== 'notice');

  const handleDelete = (id: string) => {
    toast.promise(deleteCredential(id), {
      loading: '正在删除',
      success: '删除成功',
      error: '删除失败',
      finally: () => void mutate(),
    });
  };

  return (
    <>
      <DialogTitle>{detail?.displayName}</DialogTitle>
      <DialogDescription>
        所有账号信息都将被加密储存，不会泄露您的关键信息（如密钥），也不会回传至前台
      </DialogDescription>
      <div className="relative w-full overflow-auto">
        <Table className="w-full">
          <TableCaption>没有更多了</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background">名称</TableHead>
              {rows?.map(({ name, displayName }, i) => <TableHead key={i}>{displayName ?? name}</TableHead>)}
              <TableHead className="sticky right-0 bg-background">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials?.map(({ data, _id }, i) => (
              <TableRow key={i} className="table-row">
                <TableCell className="sticky left-0 w-full min-w-24 max-w-64 break-words bg-background">
                  {data.displayName}
                </TableCell>
                {rows?.map(({ name, default: propDef }, j) => (
                  <TableCell key={j} className="w-full min-w-32 max-w-64 break-words">
                    {data[name] ?? propDef}
                  </TableCell>
                ))}
                <TableCell className="sticky right-0 w-full min-w-16 max-w-64 bg-background">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button icon={<Trash2 />} variant="outline" size="small" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>即将删除外部账号</AlertDialogTitle>
                        <AlertDialogDescription>
                          确认删除该外部账号吗，删除后工作流中将无法正常使用此账号。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => _id && handleDelete(_id)}>删除</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
