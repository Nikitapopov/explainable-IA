import React, {useState} from 'react';
import APIClient, {BASE_URI} from "../apiClient";
import TextField from "@mui/material/TextField";
import {Autocomplete, Box, Button, LinearProgress, Modal, Typography} from "@mui/material";

const plots = [
    {name: 'ebm', scale: 'both'},
    {name: 'linear model', scale: 'both'},
    {name: 'decision tree', scale: 'both'},
    {name: 'decision rule', scale: 'both'},
    {name: 'shap', scale: 'local'},
    {name: 'lime', scale: 'local'},
    {name: 'pdp', scale: 'global'},
    {name: 'morris', scale: 'global'},
]

function InterpretML({isLoadingInstanceCount, instanceCount}) {
    const [currInstance, setCurrInstance] = useState('');

    const [isModelOpen, setIsModelOpen] = useState(false);
    const [isInterpretationInProcess, setIsInterpretationInProcess] = useState(false);
    const [interpretationResult, setInterpretationResult] = useState({time: null, token: null, extension: null});

    const [plot, setPlot] = useState(null)
    const [inputValue, setInputValue] = useState('')

    function handleOnClick() {
        setIsModelOpen(true)
        setIsInterpretationInProcess(true)
        new APIClient().interpretInterpretMl(plot, currInstance)
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

    const scale = plots.find(p => p.name === plot)?.scale;
    const isInstanceInputIncorrect = (scale === 'local' && !(Number.isInteger(parseInt(currInstance)) && currInstance >= 0 && currInstance <= instanceCount))
        || (scale === 'both' && currInstance !== '' && !(Number.isInteger(parseInt(currInstance)) && currInstance >= 0 && currInstance <= instanceCount))

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            p: 1,
        }}>
            <Autocomplete
                value={plot}
                onChange={(event, newValue) => {
                    setPlot(newValue);
                }}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                id="controllable-states-demo"
                disablePortal
                options={plots.map(p => p.name)}
                fullWidth
                renderInput={(params) => <TextField {...params} label="??????????"/>}
            />

            {(scale === 'local' || scale === 'both')
            && <Box xs={{flexDirection: 'column'}} textAlign='left' pb={2}>
                <Typography variant="subtitle1" gutterBottom component="div">
                    ?????????????? ??????????????????
                </Typography>
                <TextField value={currInstance}
                           onChange={event => setCurrInstance(event.target.value)}
                           error={isInstanceInputIncorrect}
                           helperText={`???? 0 ???? ${instanceCount}${scale === 'both' ? ' ?????? ???????????????? ???????????? ?????? ???????????????????? ??????????????????????????' : ''}`}
                />
            </Box>
            }

            <Button variant="outlined"
                    onClick={handleOnClick}
                    disabled={
                        plot === null
                        || ((scale === 'local' || scale === 'both') && (isLoadingInstanceCount || isInstanceInputIncorrect))
                        || isInterpretationInProcess
                    }
            >
                ??????????
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
                        ?????????????????????????? ????????????
                    </Typography>
                    {isInterpretationInProcess
                        ? <LinearProgress/>
                        : <Box>
                            <Typography id="modal-modal-description" sx={{mt: 2}}>
                                ?????????? ???????????? ????????????????????????????: {interpretationResult.time}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{mt: 2}}>
                                ?????????????? ??????????
                                <Button target="_blank"
                                        href={`${BASE_URI}/interpretation-file/${interpretationResult.token}/${interpretationResult.extension}`}>
                                    ??????????????
                                </Button>
                            </Typography>
                        </Box>
                    }
                </Box>
            </Modal>
        </Box>
    );
}

export default InterpretML;