import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const subjects = ['Order Inquiry', 'Product Availability', 'Private Appointment', 'Press & Editorial', 'Other'];

export function ContactForm() {
  return (
    <section className="flex justify-center">
      <div className="mx-auto w-[92%] rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8 md:w-[70%] lg:w-[55%]">
        <p className="font-label text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant">
          Direct Inquiry
        </p>
        <h2 className="font-headline mt-2 text-3xl font-black uppercase tracking-tight text-primary md:text-4xl">
          Get in Touch
        </h2>

        <form className="mt-8 space-y-5" action="#" method="post">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" name="name" placeholder="Enter your full name" aria-label="Name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" name="email" placeholder="hello@example.com" aria-label="Email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-subject">Subject</Label>
            <Select id="contact-subject" name="subject" aria-label="Subject" defaultValue="Order Inquiry">
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              name="message"
              placeholder="Write your message here..."
              aria-label="Message"
              className="min-h-36"
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            Send Message
          </Button>
        </form>
      </div>
    </section>
  );
}
