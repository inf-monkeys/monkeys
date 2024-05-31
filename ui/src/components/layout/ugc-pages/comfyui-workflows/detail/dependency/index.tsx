import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { checkComfyuiDependencies, installComfyuiDependencies, useComfyuiServers } from '@/apis/comfyui';
import { IComfyuiWorkflow, IComfyuiWorkflowDependencyUninstalledNode } from '@/apis/comfyui/typings';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface IComfyuiWofrkflowDependencyProps {
  comfyuiWorkflow: IComfyuiWorkflow;
}

export const ComfyuiWorkflowDependency: React.FC<IComfyuiWofrkflowDependencyProps> = ({ comfyuiWorkflow }) => {
  const { t } = useTranslation();
  const { id } = comfyuiWorkflow;
  const { data: servers = [] } = useComfyuiServers();

  const [installButtonLoading, setInstallButtonLoading] = useState<boolean>(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [uninstalledNodes, setUninstalledNodes] = useState<IComfyuiWorkflowDependencyUninstalledNode[]>([]);
  const getDependencies = async (server: string) => {
    const data = await checkComfyuiDependencies(id, server);
    if (data?.uninstalled_nodes.length) {
      setUninstalledNodes(data.uninstalled_nodes);
    }
  };

  const handleInstallDependencies = async () => {
    if (!selectedServer) {
      toast.error('请选择服务器');
      return;
    }
    setInstallButtonLoading(true);
    try {
      await installComfyuiDependencies(selectedServer, {
        nodes: uninstalledNodes,
      });
    } finally {
      setInstallButtonLoading(false);
    }
  };

  useEffect(() => {
    if (selectedServer) {
      getDependencies(selectedServer);
    }
  }, [selectedServer]);

  return (
    <div>
      <Select
        onValueChange={(val) => {
          setSelectedServer(val);
        }}
      >
        <SelectTrigger className="w-80">
          <SelectValue placeholder={t('ugc-page.comfyui-workflow.detail.tabs.dependency.select.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {servers.map((server) => (
            <SelectItem key={server.address} value={server.address}>
              {server.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedServer && (
        <div>
          <br></br>
          <h1
            className="text-xl font-bold"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignContent: 'center',
            }}
          >
            自定义节点{' '}
            <Button
              variant="solid"
              style={{
                marginRight: '1rem',
              }}
              loading={installButtonLoading}
              onClick={handleInstallDependencies}
            >
              一键安装依赖
            </Button>
          </h1>
          <br></br>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  style={{
                    width: '150px',
                  }}
                >
                  名称
                </TableHead>
                <TableHead
                  style={{
                    width: '200px',
                  }}
                >
                  描述
                </TableHead>
                <TableHead
                  style={{
                    width: '150px',
                  }}
                >
                  链接
                </TableHead>
                <TableHead
                  style={{
                    width: '50px',
                  }}
                >
                  作者
                </TableHead>
                <TableHead
                  style={{
                    width: '80px',
                  }}
                >
                  Star 数
                </TableHead>
                <TableHead
                  style={{
                    width: '100px',
                  }}
                >
                  是否已安装
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uninstalledNodes?.map(({ stars, author, reference, title, description }, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{title}</TableCell>
                  <TableCell>{description}</TableCell>
                  <TableCell>
                    <a
                      className="transition-colors hover:text-primary-500"
                      href={reference}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {reference}
                    </a>
                  </TableCell>
                  <TableCell>{author}</TableCell>
                  <TableCell>{stars}</TableCell>
                  <TableCell>未安装</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
