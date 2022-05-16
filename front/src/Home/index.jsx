import React, {useEffect, useState} from 'react';
import APIClient from '../apiClient'
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Lime from "../interpreters/Lime";
import Shap from "../interpreters/Shap";
import {Box, Grid, Paper, Typography} from "@mui/material";
import Shapash from "../interpreters/Shapash";
import Dalex from "../interpreters/Dalex";
import InterpretML from "../interpreters/InterpretML";
import UploadFile from "../other/UploadFile";

const options = ['Lime', 'Shap', 'Shapash', 'Dalex', 'Interpret ML'];

function Home() {
    const [currInterpreter, setCurrInterpreter] = useState(null)
    const [inputValue, setInputValue] = useState('')
    const [isLoadingInstanceCount, setIsLoadingInstanceCount] = useState(false);
    const [instanceCount, setInstanceCount] = useState(0);

    useEffect(() => {
        setIsLoadingInstanceCount(true);
        (async () => {
            const result = await new APIClient().getDataSize();
            setInstanceCount(result);
            setIsLoadingInstanceCount(false);
        })()
    }, [])

    function renderInterpreter() {
        switch (currInterpreter) {
            case options[0]:
                return <Lime isLoadingInstanceCount={isLoadingInstanceCount}
                             instanceCount={instanceCount}
                />
            case options[1]:
                return <Shap isLoadingInstanceCount={isLoadingInstanceCount}
                             instanceCount={instanceCount}
                />;
            case options[2]:
                return <Shapash isLoadingInstanceCount={isLoadingInstanceCount}
                                instanceCount={instanceCount}
                />;
            case options[3]:
                return <Dalex isLoadingInstanceCount={isLoadingInstanceCount}
                              instanceCount={instanceCount}
                />;
            case options[4]:
                return <InterpretML isLoadingInstanceCount={isLoadingInstanceCount}
                                    instanceCount={instanceCount}
                />;
        }
    }

    return (
        <Grid container spacing={2} p={6}>
            <Grid item xs={12}>
                <Paper>
                    <Box p={1}>
                        <Typography variant="h5" gutterBottom component="div">
                            Загрузка модели
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-around',
                            '& button': {m: 1}
                        }}>
                            <UploadFile
                                btnText='Загрузить модель'
                                btnTextNew='Загрузить другую модель'
                                fileUploadUrl="upload-model"
                                checkDownloaded={() => {return new APIClient().checkModelDownloaded()}}
                            />
                            <UploadFile
                                btnText='Загрузить данные'
                                btnTextNew='Загрузить другие данные'
                                fileUploadUrl="upload-data"
                                checkDownloaded={() => {return new APIClient().checkDataDownloaded()}}
                            />
                        </Box>
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        flexDirection: 'column',
                        p: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                    }}>
                        <Autocomplete
                            value={currInterpreter}
                            onChange={(event, newValue) => {
                                setCurrInterpreter(newValue);
                            }}
                            inputValue={inputValue}
                            onInputChange={(event, newInputValue) => {
                                setInputValue(newInputValue);
                            }}
                            id="controllable-states-demo"
                            disablePortal
                            options={options}
                            fullWidth
                            renderInput={(params) => <TextField {...params} label="Интерпретатор"/>}
                        />
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={8}>
                <Paper>
                    {renderInterpreter()}
                </Paper>
            </Grid>
        </Grid>
    )

}

export default Home;