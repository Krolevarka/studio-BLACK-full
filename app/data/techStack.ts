export interface TechStackGroup {
  name: string
  desc: string
}

export const techList: TechStackGroup[] = [
  {
    name: 'Frontend',
    desc: 'Vue, Nuxt, React, Next.js, JavaScript, TypeScript, HTML, CSS, SCSS, GSAP.'
  },
  {
    name: 'Backend',
    desc: 'Node.js, Go, Kafka, RabbitMQ, BullMQ, Redis, MongoDB, PostgreSQL, OpenSearch / Elasticsearch, GraphQL, Socket.IO.'
  },
  {
    name: 'Mobile',
    desc: 'React Native, NativeScript, Dart, Swift, Kotlin.'
  },
  {
    name: 'Infrastructure',
    desc: 'Docker, Kubernetes, Helm, Terraform, CI/CD, GitHub Actions, Nginx, VPS.'
  }
]
