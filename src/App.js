import React, { useState, useEffect } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { message, Upload, Button, Form, List, Card } from 'antd';

const { Dragger } = Upload;

const App = () => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFilesInfo, setSelectedFilesInfo] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    const totalSize = fileList.reduce((total, file) => total + file.size, 0);
    let totalDisplay = '';
    totalDisplay = totalSize < 1000 * 1000 ? (totalSize / 1000).toFixed(2) + 'KB' : (totalSize / 1000 / 1000).toFixed(2) + 'MB';
    setSelectedFilesInfo(`已选择 ${fileList.length} 张，总大小 ${totalDisplay}`);
  }, [fileList]);

  const customAxios = axios.create();

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }

    setUploading(true);

    try {
      const promises = fileList.map(async (file) => {
        const formData = new FormData();
        formData.append('photo', file.originFileObj);

        file.status = 'uploading';
        const response = await customAxios.post('https://nihaoya.com/upload', formData, {
          onUploadProgress: (progressEvent) => {
            const percents = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            file.percent = percents;
            setFileList([...fileList]);
          },
        });

        if (response.status === 200) {
          message.success(`${file.name} 上传成功`);
          file.status = 'done';
          setFileList([...fileList]);

          // 保存已上传的文件信息（name和对应的imgUrl）
          setUploadedFiles((prevUploadedFiles) => [
            ...prevUploadedFiles,
            { name: file.name, url: response.data.url },
          ]);
        } else {
          message.error(`${file.name} 上传失败`);
          file.status = 'error';
          setFileList([...fileList]);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('文件上传出错:', error);
      message.error('文件上传出错');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setFileList([]);
    setUploadedFiles([]);
  };

  const props = {
    name: 'photo',
    multiple: true,
    accept: 'image/png,image/jpg,image/jpeg,image/gif,image/bmp',
    fileList,
    customRequest: () => { },
    beforeUpload: () => false,
    onChange: (info) => {
      setFileList(info.fileList);
    },
  };

  return (
    <>
      <Form encType='multipart/form-data'>
        <Dragger {...props} listType='picture'>
          <p className='ant-upload-drag-icon'>
            <InboxOutlined />
          </p>
          <p className='ant-upload-text'>点击选择或拖拽上传</p>
          <p className='ant-upload-hint'>支持单次或批量上传</p>
        </Dragger>

        <Button
          type='primary'
          onClick={handleUpload}
          disabled={fileList.length === 0 || uploading}
        >
          {uploading ? '上传中...' : '确认上传'}
        </Button>

        <Button
          danger
          onClick={handleCancel}
          style={{ marginLeft: '10px' }}
          disabled={uploading || fileList.length === 0}
        >
          一键清除
        </Button>

        <div style={{ marginTop: '10px' }}>{selectedFilesInfo}</div>

        {/* 显示已上传的文件信息列表 */}
        <List
          grid={{ gutter: 16, column: 3 }}
          dataSource={uploadedFiles}
          renderItem={(item, index) => (
            <List.Item key={index}>
              <Card bordered={true} hoverable>
                <p>{item.name}</p>
                <p>{item.url}</p>
              </Card>
            </List.Item>
          )}
        />
      </Form>
    </>
  );
};

export default App;
