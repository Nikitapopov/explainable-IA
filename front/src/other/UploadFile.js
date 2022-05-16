import React, {useEffect, useState} from 'react';
import APIClient from "../apiClient";
import {Box, Button, LinearProgress, Typography} from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';

export function UploadFile({btnText, btnTextNew, fileUploadUrl, checkDownloaded}) {
    const [isFileDownloaded, setIsFileDownloaded] = useState(null);
    const [isFileDownloadedLoading, setIsFileDownloadedLoading] = useState(false);
    const [currFile, setCurrFile] = useState('');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        setIsFileDownloadedLoading(true)
        checkDownloaded().then(response => {
            setIsFileDownloaded(response === 'True')
            setIsFileDownloadedLoading(false)
        })
    }, [])

    function upload(event) {
        console.log(event.target.files[0])
        const currFileTemp = event.target.files[0];
        setProgress(0);
        setCurrFile(currFileTemp);
        console.log('fileUploadUrl', fileUploadUrl)

        new APIClient().upload(currFileTemp, fileUploadUrl, (event) => {
            setProgress(Math.round((100 * event.loaded) / event.total));
        }).then(response => {
            console.log('response', response)
            setIsError(false);
            setCurrFile(undefined);
        }).catch((e) => {
            console.log('e', e)
            setProgress(0);
            setMessage("Could not upload the file!");
            setCurrFile(undefined);
            setIsError(true);
        });
    }

    return (
        <div>
            <label htmlFor = {`contained-button-file${fileUploadUrl}`}>
                <input
                    id={`contained-button-file${fileUploadUrl}`}
                    multiple
                    type="file"
                    onChange={upload}
                    style={{display: 'none'}}
                />
                <LoadingButton
                    loading={isFileDownloadedLoading}
                    variant="outlined"
                    component="span"
                    loadingIndicator="Загрузка статуса..."
                >
                    {isFileDownloaded ? btnTextNew : btnText}
                </LoadingButton>
            </label>
            <Typography variant="subtitle2" className={`upload-message ${isError ? "error" : ""}`}>
                {message}
            </Typography>
            {currFile && (
                <Box className="mb25" display="flex" alignItems="center">
                    <Box width="100%" mr={1}>
                        <LinearProgress variant="determinate" value={progress}/>
                    </Box>
                    <Box minWidth={35}>
                        <Typography variant="body2" color="textSecondary">{`${progress}%`}</Typography>
                    </Box>
                </Box>)
            }
        </div>
    )
}

export default UploadFile;