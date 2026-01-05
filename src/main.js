import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.portal-dark'
    }
  }
})

document.documentElement.classList.add('portal-dark')

app.component('InputText', InputText)
app.component('Button', Button)
app.component('Card', Card)
app.component('Tag', Tag)
app.component('ProgressBar', ProgressBar)
app.component('Dialog', Dialog)
app.component('Divider', Divider)

app.mount('#app')
