import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES, Country } from "@/lib/countries";

interface CountrySelectorProps {
    onSelect: (country: Country) => void;
    selectedCountry?: Country;
    disabled?: boolean;
}

export function CountrySelector({ onSelect, selectedCountry, disabled }: CountrySelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(selectedCountry?.code || "IN");

    const selected = React.useMemo(
        () => COUNTRIES.find((country) => country.code === value),
        [value]
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-[100px] justify-between bg-secondary border-border text-foreground hover:bg-secondary/80 px-2"
                >
                    <span className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-base leading-none">{selected?.flag}</span>
                        <span className="text-sm font-medium">{selected?.dialCode}</span>
                    </span>
                    <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 shadow-xl border-border bg-popover" align="start">
                <Command className="bg-popover">
                    <CommandInput placeholder="Search country..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px]">
                            {COUNTRIES.map((country) => (
                                <CommandItem
                                    key={country.code}
                                    value={`${country.name} ${country.dialCode}`}
                                    onSelect={() => {
                                        setValue(country.code);
                                        onSelect(country);
                                        setOpen(false);
                                    }}
                                    className="flex items-center justify-between py-2 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{country.flag}</span>
                                        <span className="text-sm font-medium">{country.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{country.dialCode}</span>
                                        {value === country.code && (
                                            <Check className="h-3.5 w-3.5 text-primary" />
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
