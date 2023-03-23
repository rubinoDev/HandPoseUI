export default class Controller {
    #view
    #service
    #camera
    #worker
    #blinkCounter = 0
    constructor({view, worker, camera, videoUrl}){
        this.#view = view
        this.#camera = camera
        this.#worker = this.#configureWorker(worker)

        this.#view.configureOnBtnClick(this.onBntStart.bind(this))
        this.#view.setVideoSrc(videoUrl)
    }

    static async initialize(deps) {
        const controller = new Controller(deps)
        controller.log('Not yet detecting eye blink! click in the button to start')
        return controller.init()
    }
    #configureWorker(worker){
        let ready = false
        worker.onmessage = ({data}) => {
            if('READY' === data){
                console.log('worker is ready!')
                this.#view.enableButton()
                ready = true
                return
            }
            const blinked = data.blinked
            this.#blinkCounter += blinked
            this.#view.togglePlayVideo()
            console.log('blinked', blinked)
        }
        return {
            send(msg){
                if(!ready) return;
                worker.postMessage(msg)
            }
        }
    }
    async init(){
        console.log('init!')
    }

    loop(){
        const video = this.#camera.video
        const img = this.#view.getVideoFrame(video)
        this.#worker.send(img)
        this.log(`detecting eye blink...`)

        setTimeout(() => this.loop(), 100)
    }

    log(text){
        const times = `      - blinked times: ${this.#blinkCounter}`
        this.#view.log(`status: ${text}`.concat(this.#blinkCounter ? times : ""))
    }
    onBntStart(){
        this.log('initializing detection...')
        this.#blinkCounter = 0
        this.loop()
    }
}