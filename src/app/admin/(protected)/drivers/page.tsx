import Link from "next/link";
import { Car, Phone, Plus, UserRound } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusPill,
  Td,
  TableWrap,
  Th,
} from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { DriverForm, VehicleForm } from "@/components/admin/fleet-forms";
import { deleteDriver, deleteVehicle } from "@/app/actions/admin/operations";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { telLink, whatsappLink } from "@/lib/whatsapp";
import type { Driver, Vehicle } from "@/lib/types";

export const metadata = { title: "Drivers & Vehicles" };

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ driver?: string; vehicle?: string }>;
}) {
  const { driver: driverParam, vehicle: vehicleParam } = await searchParams;
  const db = supabaseAdmin();

  const [{ data: driverRows }, { data: vehicleRows }] = await Promise.all([
    db.from("drivers").select("*").order("name"),
    db.from("vehicles").select("*").order("name"),
  ]);

  const drivers = (driverRows as Driver[]) ?? [];
  const vehicles = (vehicleRows as Vehicle[]) ?? [];
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

  const editingDriver =
    driverParam && driverParam !== "new"
      ? drivers.find((d) => d.id === driverParam)
      : undefined;
  const editingVehicle =
    vehicleParam && vehicleParam !== "new"
      ? vehicles.find((v) => v.id === vehicleParam)
      : undefined;

  const showDriverForm = Boolean(driverParam);
  const showVehicleForm = Boolean(vehicleParam);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers & vehicles"
        subtitle="Who drives what. Transfer requests are assigned from this list."
        actions={
          <>
            <Link href="/admin/drivers?vehicle=new" className="btn btn-outline btn-sm">
              <Plus size={15} strokeWidth={2} />
              Add vehicle
            </Link>
            <Link href="/admin/drivers?driver=new" className="btn btn-primary btn-sm">
              <Plus size={15} strokeWidth={2} />
              Add driver
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          {/* Drivers ------------------------------------------------- */}
          <Panel title="Drivers" bodyClassName="">
            {drivers.length === 0 ? (
              <EmptyState
                icon={<UserRound size={20} strokeWidth={1.4} />}
                title="No drivers yet"
                description="Add the people who run your transfers so you can assign them to jobs."
                action={
                  <Link href="/admin/drivers?driver=new" className="btn btn-primary btn-sm">
                    <Plus size={15} strokeWidth={2} />
                    Add driver
                  </Link>
                }
              />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Driver</Th>
                    <Th>Vehicle</Th>
                    <Th>Contact</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => {
                    const vehicle = driver.vehicle_id
                      ? vehicleById.get(driver.vehicle_id)
                      : undefined;
                    const wa = whatsappLink(driver.whatsapp ?? driver.phone);
                    const tel = telLink(driver.phone);

                    return (
                      <tr key={driver.id}>
                        <Td>
                          <span className="block font-medium">{driver.name}</span>
                          <span className="block text-xs text-ink-muted">
                            {driver.phone}
                          </span>
                        </Td>
                        <Td className="text-sm">
                          {vehicle ? (
                            <>
                              {vehicle.name}
                              <span className="block text-xs text-ink-muted">
                                {vehicle.registration}
                              </span>
                            </>
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </Td>
                        <Td>
                          <div className="flex gap-1.5">
                            {tel && (
                              <a
                                href={tel}
                                aria-label={`Call ${driver.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-sand-deep hover:text-ink"
                              >
                                <Phone size={14} strokeWidth={1.6} />
                              </a>
                            )}
                            {wa && (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`WhatsApp ${driver.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-sand-deep hover:text-[#1faa54]"
                              >
                                <WhatsAppIcon size={14} />
                              </a>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <StatusPill status={driver.status} />
                        </Td>
                        <Td align="right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/admin/drivers?driver=${driver.id}`}
                              className="btn btn-outline btn-sm"
                            >
                              Edit
                            </Link>
                            <form action={deleteDriver}>
                              <input type="hidden" name="id" value={driver.id} />
                              <SubmitButton
                                variant="danger"
                                confirm={`Remove ${driver.name}? Past transfers keep their details.`}
                              >
                                Remove
                              </SubmitButton>
                            </form>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            )}
          </Panel>

          {/* Vehicles ------------------------------------------------ */}
          <Panel title="Vehicles" bodyClassName="">
            {vehicles.length === 0 ? (
              <EmptyState
                icon={<Car size={20} strokeWidth={1.4} />}
                title="No vehicles yet"
                description="Add your fleet so drivers and transfers can be matched to a vehicle."
                action={
                  <Link
                    href="/admin/drivers?vehicle=new"
                    className="btn btn-primary btn-sm"
                  >
                    <Plus size={15} strokeWidth={2} />
                    Add vehicle
                  </Link>
                }
              />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Vehicle</Th>
                    <Th>Type</Th>
                    <Th>Capacity</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <Td>
                        <span className="block font-medium">{vehicle.name}</span>
                        <span className="block text-xs text-ink-muted">
                          {vehicle.registration}
                        </span>
                      </Td>
                      <Td className="text-sm">{vehicle.vehicle_type}</Td>
                      <Td className="text-sm whitespace-nowrap">
                        {vehicle.capacity} pax
                        <span className="block text-xs text-ink-muted">
                          {vehicle.luggage_capacity} bags
                        </span>
                      </Td>
                      <Td>
                        <StatusPill status={vehicle.status} />
                      </Td>
                      <Td align="right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/drivers?vehicle=${vehicle.id}`}
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </Link>
                          <form action={deleteVehicle}>
                            <input type="hidden" name="id" value={vehicle.id} />
                            <SubmitButton
                              variant="danger"
                              confirm={`Remove ${vehicle.name}? Drivers assigned to it will lose the link.`}
                            >
                              Remove
                            </SubmitButton>
                          </form>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            )}
          </Panel>
        </div>

        {/* Forms ----------------------------------------------------- */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {showDriverForm && (
            <DriverForm key={driverParam} driver={editingDriver} vehicles={vehicles} />
          )}
          {showVehicleForm && (
            <VehicleForm key={vehicleParam} vehicle={editingVehicle} />
          )}
          {!showDriverForm && !showVehicleForm && (
            <div className="panel p-6 text-sm leading-relaxed text-ink-muted">
              Choose <strong className="text-ink">Add driver</strong> or{" "}
              <strong className="text-ink">Add vehicle</strong> above, or edit an existing
              one, and the form appears here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
