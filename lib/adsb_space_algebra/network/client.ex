defmodule AdsbSpaceAlgebra.Network.Client do

  use GenServer

  require Logger

  @max_retries 10
  @retry_interval 1000

  defmodule DefaultCallbacks do
    require Logger

    def on_connect(state) do
      Logger.info("tcp connect to #{state.host}:#{state.port}", ansi_color: :yellow)
    end

    def on_disconnect(state) do
      Logger.info("tcp disconnect from #{state.host}:#{state.port}", ansi_color: :yellow)
    end

    def on_failure(state) do
      Logger.info("tcp failure from #{state.host}:#{state.port}. Max retries exceeded.", ansi_color: :yellow)
    end
  end

  defmodule State do
    defstruct host: "nope",
              port: 1234,
              failure_count: 0,
              on_connect: &DefaultCallbacks.on_connect/1,
              on_disconnect: &DefaultCallbacks.on_disconnect/1,
              on_failure: &DefaultCallbacks.on_failure/1

  end

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(opts) do
    state = opts_to_initial_state(opts)
    case :gen_tcp.connect(state.host, state.port, []) do
      {:ok, _socket} ->
        state.on_connect.(state)
        {:ok, state}
      {:error, _reason} ->
        new_state = %{state | failure_count: 1}
        new_state.on_disconnect.(new_state)
        {:ok, new_state, @retry_interval}
    end
  end

  def handle_adsb("MSG,3," <> data) do
    tmp = String.split(data, ",")
    icoa = Enum.at(tmp,2)
    altitude = Enum.at(tmp, 9)
    lat = Enum.at(tmp, 12)
    lon = Enum.at(tmp, 13)
    Logger.debug("#{icoa} reporting at #{lat}, #{lon} alt #{altitude}")
    AdsbSpaceAlgebraWeb.Endpoint.broadcast!(
      "aircraft:updates",
      "aircraft:position",
      %{icoa: icoa, lon: lon, lat: lat, altitude: altitude}
      # %{features: [
      #   %{type: "Feature",
      #     properties: %{
      #       id: icoa
      #     },
      #     geometry: %{
      #       type: "Point",
      #       coordinates: [ lon, lat ]
      #     }
      #   }
      # ]}
    )
  end
  def handle_adsb(_ignored) do
  end


  def handle_info({:tcp, _socket, message}, state) do
    handle_adsb(List.to_string(message))
    {:noreply, state}
  end

  def handle_info(:timeout, state = %State{failure_count: failure_count}) do
    if failure_count <= @max_retries do
      case :gen_tcp.connect(state.host, state.port, []) do
        {:ok, _socket} ->
          new_state = %{state | failure_count: 0}
          new_state.on_connect.(new_state)
          {:noreply, new_state}
        {:error, _reason} ->
          new_state = %{state | failure_count: failure_count + 1}
          new_state.on_disconnect.(new_state)
          :timer.sleep(60 * 1000)
          {:noreply, new_state, @retry_interval}
      end
    else
      state.on_failure.(state)
      {:stop, :max_retry_exceeded, state}
    end
  end

  def handle_info({:tcp_closed, _socket}, state) do
    case :gen_tcp.connect(state.host, state.port, []) do
      {:ok, _socket} ->
        new_state = %{state | failure_count: 0}
        new_state.on_connect.(new_state)
        {:noreply, new_state}
      {:error, _reason} ->
        new_state = %{state | failure_count: 1}
        new_state.on_disconnect.(new_state)
        {:noreply, new_state, @retry_interval}
    end
  end

  defp opts_to_initial_state(opts) do
    host = Keyword.get(opts, :host, "localhost") |> String.to_charlist
    port = Keyword.fetch!(opts, :port)
    %State{host: host, port: port}
  end

end
