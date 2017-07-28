
document.addEventListener('DOMContentLoaded',() => {
    InputFileService.createInputTrigger(uploadComponent, uploadBtn, _uploadCallback)
    InputFileService.createInputTrigger(exportComponent, exportBtn, _exportCallback)
    ipcRenderer.send('load-sender')

})

//-------------- # Module Imports
const { shell, ipcRenderer } = require('electron')
const InputFileService = require('../../utils/services/input-file-service.js')

//-------------- # Variables and Properts
let uploadComponent  = document.querySelector( "#upload-input" )  
let uploadBtn = document.querySelector( "#upload-btn" )
let uploadPath = document.querySelector("#upload-path")
let exportComponent = document.querySelector( "#export-input" )  
let exportBtn = document.querySelector( "#export-btn" )
let exportPath = document.querySelector("#export-path")
let dropContainer = document.querySelector('#drop-container')
let startBtn = document.querySelector('#start-btn')
let infoBtn = document.querySelector('#info-btn')
let file = ""
let folder = ""

//-------------- # Event Handling
startBtn.addEventListener('click', _onStartBtnClick)
infoBtn.addEventListener('click', _onInfoBtnClick)
dropContainer.ondragover = () => { return false }
dropContainer.ondragleave = () => { return false }
dropContainer.ondragend = () => { return false }
dropContainer.ondrop = _onDropContainerDrop
ipcRenderer.on('filter-stop', _onFilterStop)
ipcRenderer.on('input-short', _onInputShort)
ipcRenderer.on('output-short', _onOutputShort)
ipcRenderer.on('test', () => {/*DO SOMETHING*/})
ipcRenderer.on('process-error', _onProcessError)

//-------------- # Private Functions
function _uploadCallback(data) {
    if(data.files)
        data = data.files[0]
    uploadPath.value = file = data.path
    _validateRequirements()
}

function _exportCallback(data) {
    if(data.files)
        data = data.files[0]
    exportPath.value = folder = data.path
    _validateRequirements()
}

function _validateRequirements(){
    if(file && folder)
        startBtn.classList.remove("disabled")
}

function _onStartBtnClick(){
    startBtn.setAttribute('disabled', true)
    swal({
        title: "Processando o arquivo.",
        text: `
            Só um minuto, por favor...
            </br></br>
            <img style="width: 35%; height: auto;" src="../../img/sleeping.png">`,
        showConfirmButton: false,
        html: true
    })
    setTimeout( () => {
        ipcRenderer.send('start-process', file, folder)
    },300)
}

function _onInfoBtnClick(){
    swal.close()
    ipcRenderer.send('info-required')
}

function _onDropContainerDrop(event){
    event.preventDefault()

    let data = event.dataTransfer
    let folderList = _getFolderList(data.files)
    let pdfList = _getPdfList(data.files)

    if(!_isValidFileLists(folderList, pdfList, data.files.length)){
        let text = ""
        
        if(folderList.length < 2 && pdfList.length < 2 && data.files.length < 3)
            text = "Desculpe, não condigo trabalhar com esse tipo de arquivo"
        else
            text = "Por favor, escolha somente um PDF e/ou somente uma pasta"

        swal({
            title: "Ooops!",
            text: text,
            confirmButtonText: "Entendi",
            type: "warning"
        })
        return false
    }

    if(folderList.length == 1){
        _exportCallback(folderList[0])
    }

    if(pdfList.length == 1){
        _uploadCallback(pdfList[0])
    }

    return false 
}

function _getFolderList(fileList) {
    return Array.from(fileList).filter(file => {
        if(file.type == '' && file.name.split('.').length == 1) 
            return file
    })
}

function _getPdfList(fileList) {
    return Array.from(fileList).filter(file => {
        if(file.type == 'application/pdf')
            return file
    })
}

function _isValidFileLists(folderList = [], pdfList = [], totalLen = -1) {
    let pdfLen = pdfList.length
    let folderLen = folderList.length
    return (folderLen == 1 || folderLen == 0) && (pdfLen == 1 || pdfLen == 0) && (pdfLen + folderLen == totalLen)
}

function _onFilterStop() {
    swal({
        title: "Pronto!",
        text: `Tudo certo, você já pode se divertir com os novos arquivos!
                </br></br>
                Mas tenha cuidado, com grandes <i>arquivos</i> vêm grandes <i>responsabilidades</i>.`,
        confirmButtonText: "Show",
        type: "success",
        html:true
    }, () => startBtn.removeAttribute('disabled'))
}

function _onInputShort() {
    uploadBtn.click()
}

function _onOutputShort() {
    exportBtn.click()
}

function _onProcessError(event, err) {
    console.log(JSON.parse(err).stack)
    swal({
        title: "Ooops!",
        text: `Tive problemas para entender esse arquivo!
                </br></br>
                Por favor, escolha um PDF dentro dos padrões da CETESB, caso ainda não tenha o arquivo, pode enconrtá-lo 
                <a href="#" onclick="_openExternal()">AQUI</a>
                </br>
                Pode encontrar mais dicas e informações clicancdo no botão
                <a onclick="_onInfoBtnClick()" class="btn-floating z-depth-0 transparent"><i class="material-icons blue-text text-lighten-1">info_outline</i></a>`,
        confirmButtonText: "Entendi",
        type: "warning",
        html:true
    })
    startBtn.removeAttribute('disabled')
}

function _openExternal() {
    shell.openExternal('http://areascontaminadas.cetesb.sp.gov.br/relacao-de-areas-contaminadas/')
}