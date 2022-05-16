import React, {useState} from 'react';
import APIClient, {BASE_URI} from "../apiClient";
import TextField from "@mui/material/TextField";
import {Box, Button, LinearProgress, Modal, Typography} from "@mui/material";

function Lime({isLoadingInstanceCount, instanceCount}) {
    const [currInstance, setCurrInstance] = useState('');

    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isInterpretationInProcess, setIsInterpretationInProcess] = useState(false);
    const [interpretationResult, setInterpretationResult] = useState({time: null, token: null, extension: null});

    function handleOnClick() {
        setIsModelOpen(true)
        setIsInterpretationInProcess(true)
        new APIClient().interpretLime(currInstance)
            .then(res => {
                setInterpretationResult(res)
            })
            .finally(() => {
                setIsInterpretationInProcess(false)
            })
    }

    function handleClose() {
        setIsModelOpen(false);
    }

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            p: 1,
        }}>
            <Box xs={{flexDirection: 'column'}} textAlign='left' pb={2}>
                <Typography variant="subtitle1" gutterBottom component="div">
                    Выбрать экземпляр
                </Typography>
                <TextField value={currInstance}
                           onChange={event => setCurrInstance(event.target.value)}
                           error={!(Number.isInteger(parseInt(currInstance)) && currInstance >= 0 && currInstance <= instanceCount)}
                           helperText={`От 0 до ${instanceCount}`}
                />
            </Box>
            <Button variant="outlined"
                    onClick={handleOnClick}
                    disabled={isLoadingInstanceCount || !(Number.isInteger(parseInt(currInstance)) && currInstance >= 0 && currInstance <= instanceCount)
                    || isInterpretationInProcess}
            >
                Старт
            </Button>
            <Modal
                open={isModelOpen}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Интерпретация модели
                    </Typography>
                    {isInterpretationInProcess
                        ? <LinearProgress/>
                        : <Box>
                            <Typography id="modal-modal-description" sx={{mt: 2}}>
                                Время работы интерпретатора: {interpretationResult.time}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{mt: 2}}>
                                Скачать отчет
                                <Button target="_blank"
                                        href={`${BASE_URI}/interpretation-file/${interpretationResult.token}/${interpretationResult.extension}`}>
                                    Скачать
                                </Button>
                            </Typography>
                        </Box>
                    }
                </Box>
            </Modal>
        </Box>
    );
}

export default Lime;
