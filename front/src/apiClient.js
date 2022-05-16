import axios from 'axios';

export const BASE_URI = 'http://localhost:4433';

const client = axios.create({
    baseURL: BASE_URI,
    json: true
});

class APIClient {
    getDataSize() {
        return this.perform('get', 'data-count')
    }

    checkModelDownloaded() {
        return this.perform('get', 'check-model-downloaded')
    }

    checkDataDownloaded() {
        return this.perform('get', 'check-data-downloaded')
    }

    upload(file, fileUploadUrl, onUploadProgress) {
        console.log('fileUploadUrl',fileUploadUrl)
        let formData = new FormData();
        formData.append("file", file);
        return client({
            method: 'POST',
            url: fileUploadUrl,
            data: formData,
            headers: {
                "Content-Type": "multipart/form-data",
            },
            onUploadProgress,
        }).then(resp => {
            return resp.data ? resp.data : [];
        })
    }

    interpretLime(instance_number) {
        return this.perform('post', 'lime', {
            instance_number
        })
    }

    interpretShap(plot, instance_number) {
        return this.perform('post', 'shap', {
            plot,
            instance_number
        })
    }

    interpretShapash(plot, instance_number) {
        return this.perform('post', 'shapash', {
            plot,
            instance_number
        })
    }

    interpretDalex(plot, instance_number) {
        return this.perform('post', 'dalex', {
            plot,
            instance_number
        })
    }

    interpretInterpretMl(plot, instance_number) {
        return this.perform('post', 'interpretML', {
            plot,
            instance_number
        })
    }

    async perform(method, resource, data) {
        return client({
            method,
            url: resource,
            data,
        }).then(resp => {
            return resp.data ? resp.data : [];
        })
    }
}

export default APIClient;